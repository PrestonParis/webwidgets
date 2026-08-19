import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { workerEnvSchema } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { fetchGoogleCalendarSignals } from '../provider/googleCalendarProvider.js';
import { fetchOutlookSignals } from '../provider/outlookProvider.js';
import { signalIdentity } from '../provider/providerNormalize.js';
import { createProviderProcessor } from '../provider/providerProcessor.js';
import type { ProviderStoreContract } from '../provider/providerStore.js';
import type {
    ProviderAccount,
    ProviderConnection,
    ProviderFetchResult,
    ProviderSignal,
} from '../provider/providerTypes.js';
import type { V1JobEnvelope } from '../v1/contracts.js';
import { WorkerTaskError } from '../v1/processors.js';

const originalFetch = globalThis.fetch;
const userA = '10000000-0000-4000-8000-000000000001';
const userB = '20000000-0000-4000-8000-000000000002';
const connectionA = '30000000-0000-4000-8000-000000000003';
const connectionB = '40000000-0000-4000-8000-000000000004';
const connectionC = '50000000-0000-4000-8000-000000000005';

const env = workerEnvSchema.parse({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    REDIS_URL: 'redis://localhost:6379',
});

const silentLogger: RuntimeLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};

function connection(
    id: string,
    userId: string,
    email: string,
): ProviderConnection {
    return {
        id,
        userId,
        provider: 'google',
        accountEmail: email,
        scopes: ['gmail.readonly', 'calendar.events'],
        cursor: null,
        disabled: false,
    };
}

function emailSignal(version = 'history-1'): ProviderSignal {
    return {
        kind: 'email',
        provider: 'gmail',
        objectId: 'message-1',
        providerVersion: version,
        change: 'received',
        subject: 'Status update',
        senderEmail: 'sender@example.com',
        senderName: 'Sender',
        snippet: 'A minimized preview.',
        occurredAt: '2026-08-18T12:00:00.000Z',
        threadId: 'thread-1',
        isRead: false,
        webLink: 'https://mail.google.com/mail/u/0/#inbox/message-1',
    };
}

function envelope(userId: string, connectionId: string): V1JobEnvelope {
    return {
        version: 1,
        jobId: crypto.randomUUID(),
        userId,
        correlationId: `provider-test-${connectionId}`,
        idempotencyKey: `provider-test-${connectionId}`,
        queue: 'ingestion',
        task: { kind: 'provider.sync', connectionId },
    };
}

class MemoryProviderStore implements ProviderStoreContract {
    connections = new Map<string, ProviderConnection>();
    accounts = new Map<string, ProviderAccount>();
    persisted = new Map<string, ProviderSignal>();
    failures: Array<{ code: string; detail: string }> = [];
    successes: string[] = [];
    disableAfterFirstPersist = false;

    getConnection(userId: string, connectionId: string) {
        const item = this.connections.get(connectionId);
        return Promise.resolve(item?.userId === userId ? { ...item } : null);
    }

    getAccount(item: ProviderConnection) {
        return Promise.resolve(this.accounts.get(item.id) ?? null);
    }

    markSyncing() {
        return Promise.resolve();
    }

    markSuccess(_item: ProviderConnection, cursor: string) {
        this.successes.push(cursor);
        return Promise.resolve();
    }

    markFailure(_item: ProviderConnection, code: string, detail: string) {
        this.failures.push({ code, detail });
        return Promise.resolve();
    }

    persistSignal(item: ProviderConnection, signal: ProviderSignal) {
        const key = `${item.userId}:${signalIdentity(item.id, signal).timelineKey}`;
        this.persisted.set(key, signal);
        if (this.disableAfterFirstPersist) {
            const current = this.connections.get(item.id);
            if (current) current.disabled = true;
        }
        return Promise.resolve();
    }
}

function addConnection(store: MemoryProviderStore, item: ProviderConnection) {
    store.connections.set(item.id, item);
    store.accounts.set(item.id, {
        id: crypto.randomUUID(),
        userId: item.userId,
        connectionId: item.id,
        provider: item.provider,
        email: item.accountEmail,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 60_000,
    });
}

function processor(
    store: MemoryProviderStore,
    fetchSignals: (
        connection: ProviderConnection,
    ) => Promise<ProviderFetchResult>,
    resolveToken: () => Promise<string> = () => Promise.resolve('valid-token'),
) {
    return createProviderProcessor({} as SupabaseClient, env, silentLogger, {
        store,
        resolveToken,
        fetchSignals: (item) => fetchSignals(item),
    });
}

void afterEach(() => {
    globalThis.fetch = originalFetch;
});

void describe('email and calendar timeline ingestion', () => {
    void it('isolates two users and multiple accounts with the same provider object', async () => {
        const store = new MemoryProviderStore();
        const sources = [
            connection(connectionA, userA, 'first@example.com'),
            connection(connectionB, userA, 'second@example.com'),
            connection(connectionC, userB, 'other@example.com'),
        ];
        sources.forEach((item) => addConnection(store, item));
        const run = processor(store, () =>
            Promise.resolve({
                signals: [emailSignal()],
                cursor: { email: 'history-2' },
            }),
        );
        for (const source of sources) {
            await run({
                envelope: envelope(source.userId, source.id),
                dryRun: false,
            });
        }
        assert.equal(store.persisted.size, 3);
        assert.equal(store.successes.length, 3);
    });

    void it('coalesces duplicate webhook and cursor replay delivery', async () => {
        const store = new MemoryProviderStore();
        addConnection(store, connection(connectionA, userA, 'one@example.com'));
        const run = processor(store, () =>
            Promise.resolve({
                signals: [emailSignal()],
                cursor: { email: 'history-2' },
            }),
        );
        const job = envelope(userA, connectionA);
        await run({ envelope: job, dryRun: false });
        await run({ envelope: job, dryRun: false });
        assert.equal(store.persisted.size, 1);
    });

    void it('retains meaningful provider versions as separate changes', async () => {
        const store = new MemoryProviderStore();
        addConnection(store, connection(connectionA, userA, 'one@example.com'));
        let version = 0;
        const run = processor(store, () =>
            Promise.resolve({
                signals: [emailSignal(`history-${++version}`)],
                cursor: { email: `history-${version}` },
            }),
        );
        await run({ envelope: envelope(userA, connectionA), dryRun: false });
        await run({ envelope: envelope(userA, connectionA), dryRun: false });
        assert.equal(store.persisted.size, 2);
    });

    void it('stops between signals when a connection is disconnected', async () => {
        const store = new MemoryProviderStore();
        addConnection(store, connection(connectionA, userA, 'one@example.com'));
        store.disableAfterFirstPersist = true;
        const run = processor(store, () =>
            Promise.resolve({
                signals: [emailSignal('history-1'), emailSignal('history-2')],
                cursor: { email: 'history-2' },
            }),
        );
        await run({ envelope: envelope(userA, connectionA), dryRun: false });
        assert.equal(store.persisted.size, 1);
        assert.equal(store.successes.length, 0);
    });

    void it('surfaces token expiration as source health failure', async () => {
        const store = new MemoryProviderStore();
        addConnection(store, connection(connectionA, userA, 'one@example.com'));
        const run = processor(
            store,
            () => Promise.resolve({ signals: [], cursor: {} }),
            () =>
                Promise.reject(
                    new WorkerTaskError(
                        'provider_authorization_failed',
                        'Authorization expired.',
                        false,
                    ),
                ),
        );
        await assert.rejects(
            run({ envelope: envelope(userA, connectionA), dryRun: false }),
        );
        assert.equal(store.failures[0]?.code, 'provider_authorization_failed');
        assert.equal(store.successes.length, 0);
    });

    void it('normalizes all-day dates and calendar cancellation', async () => {
        globalThis.fetch = () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        items: [
                            {
                                id: 'event-1',
                                status: 'cancelled',
                                updated: '2026-08-18T10:00:00Z',
                                summary: 'Conference',
                                start: { date: '2026-08-20' },
                                end: { date: '2026-08-21' },
                            },
                        ],
                        nextSyncToken: 'calendar-cursor-2',
                    }),
                    { status: 200 },
                ),
            );
        const result = await fetchGoogleCalendarSignals('token', undefined, 20);
        const signal = result.signals[0];
        assert.equal(signal?.allDay, true);
        assert.equal(signal?.start, '2026-08-20T00:00:00.000Z');
        assert.equal(signal?.change, 'cancelled');
        assert.equal(result.cursor, 'calendar-cursor-2');
    });

    void it('does not fabricate success for revoked Microsoft consent', async () => {
        globalThis.fetch = () =>
            Promise.resolve(new Response('{}', { status: 401 }));
        await assert.rejects(
            fetchOutlookSignals('expired', {}, 20),
            (error) =>
                error instanceof WorkerTaskError &&
                error.code === 'provider_authorization_failed',
        );
    });
});
