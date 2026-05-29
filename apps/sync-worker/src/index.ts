import './env.js'; // validate env on startup

import { Worker } from 'bullmq';
import {
    QUEUE_ACCOUNT,
    QUEUE_ALL,
    makeConnection,
    type SyncAccountPayload,
    type SyncAllPayload,
} from './queue.js';
import { getAllActiveAccounts } from './lib/supabase.js';
import { syncAccount } from './workers/syncAccount.js';
import { getAccountQueue, getAllQueue } from './queue.js';
import { env } from './env.js';

const log = (msg: string, extra?: object) =>
    console.log(
        JSON.stringify({ time: new Date().toISOString(), msg, ...extra }),
    );

// ── sync-all worker ──────────────────────────────────────────────────────────
// Receives "sync-all" or "sync-all-for-user" jobs, fans out to per-account jobs.

const allWorker = new Worker<SyncAllPayload>(
    QUEUE_ALL,
    async (job) => {
        const { triggeredBy, userId } = job.data;
        log('sync-all started', { triggeredBy, userId });

        const accounts = await getAllActiveAccounts();
        const targets = userId
            ? accounts.filter((a) => a.user_id === userId)
            : accounts;

        const accountQueue = getAccountQueue();
        await Promise.all(
            targets.map((acct) =>
                accountQueue.add(
                    'sync-account',
                    {
                        userId: acct.user_id,
                        accountId: acct.id,
                        provider: acct.provider,
                        email: acct.email,
                    },
                    // Deduplicate: skip if already queued for this account
                    { jobId: `account-${acct.id}` },
                ),
            ),
        );

        log('sync-all enqueued', { count: targets.length, triggeredBy });
        return { enqueued: targets.length };
    },
    { connection: makeConnection(), concurrency: 2 },
);

// ── sync-account worker ──────────────────────────────────────────────────────
// Syncs a single email account (Gmail or Outlook) and writes to email_snapshots.

const accountWorker = new Worker<SyncAccountPayload>(
    QUEUE_ACCOUNT,
    async (job) => {
        const { userId, accountId, provider, email } = job.data;
        log('sync-account started', { accountId, provider, email });

        const accounts = await getAllActiveAccounts();
        const account = accounts.find((a) => a.id === accountId);
        if (!account) {
            log('account not found, skipping', { accountId });
            return { synced: 0 };
        }

        const result = await syncAccount(account);
        log('sync-account done', { accountId, provider, email, ...result });
        return result;
    },
    {
        connection: makeConnection(),
        concurrency: 5,
        limiter: { max: 20, duration: 60_000 }, // max 20 account syncs per minute (API rate limit)
    },
);

// ── cron scheduler ───────────────────────────────────────────────────────────
// Uses BullMQ's repeatable jobs to schedule sync-all at a fixed interval.

async function scheduleRecurringSync() {
    const allQueue = (await import('./queue.js')).getAllQueue();
    await allQueue.upsertJobScheduler(
        'cron-sync-all',
        { every: env.SYNC_INTERVAL_MINUTES * 60 * 1000 },
        { name: 'sync-all', data: { triggeredBy: 'cron' } },
    );
    log('recurring sync scheduled', {
        intervalMinutes: env.SYNC_INTERVAL_MINUTES,
    });
}

// ── error handlers ───────────────────────────────────────────────────────────
for (const [name, worker] of [
    ['all', allWorker],
    ['account', accountWorker],
] as const) {
    worker.on('failed', (job, err) => {
        log('job failed', {
            queue: name,
            jobId: job?.id,
            error: (err as Error).message,
        });
    });
    worker.on('error', (err) => {
        log('worker error', { queue: name, error: (err as Error).message });
    });
}

// ── graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
    log('shutting down', { signal });
    await Promise.all([allWorker.close(), accountWorker.close()]);
    process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// ── startup ──────────────────────────────────────────────────────────────────
await scheduleRecurringSync();
log('sync-worker started', {
    intervalMinutes: env.SYNC_INTERVAL_MINUTES,
    batchSize: env.SYNC_BATCH_SIZE,
});

// Run an immediate sync-all on startup so fresh installs populate quickly.
await getAllQueue().add(
    'sync-all',
    { triggeredBy: 'cron' },
    { removeOnComplete: 1 },
);
