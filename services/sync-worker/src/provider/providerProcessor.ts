import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import {
    getValidGoogleToken,
    getValidMicrosoftToken,
} from '../lib/tokenRefresh.js';
import type { RuntimeLogger } from '../logger.js';
import { WorkerTaskError, type TaskProcessor } from '../v1/processors.js';
import { fetchGoogleSignals } from './googleProvider.js';
import { fetchOutlookSignals } from './outlookProvider.js';
import {
    parseProviderCursor,
    serializeProviderCursor,
} from './providerNormalize.js';
import { ProviderStore, type ProviderStoreContract } from './providerStore.js';
import type {
    ProviderAccount,
    ProviderConnection,
    ProviderFetchResult,
} from './providerTypes.js';

interface ProviderProcessorDependencies {
    store?: ProviderStoreContract;
    resolveToken?: (
        account: ProviderAccount,
        env: WorkerEnv,
        client: SupabaseClient,
    ) => Promise<string>;
    fetchSignals?: (
        connection: ProviderConnection,
        token: string,
        env: WorkerEnv,
    ) => Promise<ProviderFetchResult>;
}

async function resolveProviderToken(
    account: ProviderAccount,
    env: WorkerEnv,
    client: SupabaseClient,
) {
    const input = {
        client,
        env,
        userId: account.userId,
        accountId: account.id,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        expiresAt: account.expiresAt,
    };
    try {
        return account.provider === 'google'
            ? await getValidGoogleToken(input)
            : await getValidMicrosoftToken(input);
    } catch {
        throw new WorkerTaskError(
            'provider_authorization_failed',
            'Provider authorization is expired or revoked.',
            false,
        );
    }
}

async function fetchProviderSignals(
    connection: ProviderConnection,
    token: string,
    env: WorkerEnv,
) {
    const cursor = parseProviderCursor(connection.cursor);
    return connection.provider === 'google'
        ? fetchGoogleSignals(
              token,
              cursor,
              connection.scopes,
              env.SYNC_BATCH_SIZE,
          )
        : fetchOutlookSignals(token, cursor, env.SYNC_BATCH_SIZE);
}

export function createProviderProcessor(
    client: SupabaseClient,
    env: WorkerEnv,
    logger: RuntimeLogger,
    dependencies: ProviderProcessorDependencies = {},
): TaskProcessor {
    const store = dependencies.store ?? new ProviderStore(client);
    const resolveToken = dependencies.resolveToken ?? resolveProviderToken;
    const fetchSignals = dependencies.fetchSignals ?? fetchProviderSignals;
    return async ({ envelope, dryRun }) => {
        if (envelope.task.kind !== 'provider.sync') {
            throw new WorkerTaskError(
                'provider_invalid_task',
                'Provider processor received an invalid task.',
                false,
            );
        }
        const connection = await store.getConnection(
            envelope.userId,
            envelope.task.connectionId,
        );
        if (!connection || connection.disabled) {
            return { skipped: true, reason: 'source_inactive' };
        }
        const account = await store.getAccount(connection);
        if (!account)
            return { skipped: true, reason: 'credentials_unavailable' };
        await store.markSyncing(connection);
        try {
            const token = await resolveToken(account, env, client);
            const fetched = await fetchSignals(connection, token, env);
            let persisted = 0;
            let disconnected = false;
            if (!dryRun) {
                for (const signal of fetched.signals) {
                    const active = await store.getConnection(
                        connection.userId,
                        connection.id,
                    );
                    if (!active || active.disabled) {
                        disconnected = true;
                        break;
                    }
                    await store.persistSignal(connection, signal);
                    persisted++;
                }
            }
            if (disconnected) {
                return {
                    skipped: true,
                    reason: 'source_disconnected_during_sync',
                    persisted,
                };
            }
            const cursor = dryRun
                ? (connection.cursor ?? '{}')
                : serializeProviderCursor(fetched.cursor);
            await store.markSuccess(
                connection,
                cursor,
                env.SYNC_INTERVAL_MINUTES,
            );
            logger.info('provider source synchronized', {
                userId: connection.userId,
                connectionId: connection.id,
                provider: connection.provider,
                signalCount: fetched.signals.length,
                persisted,
                dryRun,
            });
            return {
                connectionId: connection.id,
                signalCount: fetched.signals.length,
                persisted,
                dryRun,
            };
        } catch (error) {
            const taskError =
                error instanceof WorkerTaskError
                    ? error
                    : new WorkerTaskError(
                          'provider_sync_failed',
                          'Provider synchronization failed.',
                          true,
                      );
            await store.markFailure(
                connection,
                taskError.code,
                taskError.safeDetail,
            );
            throw taskError;
        }
    };
}
