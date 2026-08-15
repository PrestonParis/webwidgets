import { Worker } from 'bullmq';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from './env.js';
import type { RuntimeLogger } from './logger.js';
import {
    createAccountQueue,
    createAllQueue,
    makeConnection,
    QUEUE_ACCOUNT,
    QUEUE_ALL,
    type SyncAccountPayload,
    type SyncAllPayload,
} from './queue.js';
import {
    getAccountForUser,
    getActiveAccountReferences,
} from './lib/supabase.js';
import { syncAccount } from './workers/syncAccount.js';

export interface EmailWorkerSet {
    names: string[];
    close(): Promise<void>;
}

export async function startEmailWorkers(
    env: WorkerEnv,
    client: SupabaseClient,
    logger: RuntimeLogger,
): Promise<EmailWorkerSet> {
    const allWorker = new Worker<SyncAllPayload>(
        QUEUE_ALL,
        async (job) => {
            const accounts = await getActiveAccountReferences(
                client,
                job.data.userId,
            );
            const queue = createAccountQueue(env);
            try {
                await Promise.all(
                    accounts.map((account) =>
                        queue.add(
                            'sync-account',
                            {
                                userId: account.user_id,
                                accountId: account.id,
                                provider: account.provider,
                            },
                            { jobId: `account-${account.id}` },
                        ),
                    ),
                );
            } finally {
                await queue.close();
            }
            logger.info('email account sync jobs enqueued', {
                count: accounts.length,
                triggeredBy: job.data.triggeredBy,
                userId: job.data.userId,
            });
            return { enqueued: accounts.length };
        },
        { connection: makeConnection(env), concurrency: 2 },
    );
    const accountWorker = new Worker<SyncAccountPayload>(
        QUEUE_ACCOUNT,
        async (job) => {
            const account = await getAccountForUser(
                client,
                job.data.userId,
                job.data.accountId,
            );
            if (!account) return { synced: 0, skipped: 'account_unavailable' };
            const result = await syncAccount(account, { client, env });
            logger.info('email account sync completed', {
                accountId: account.id,
                userId: account.user_id,
                provider: account.provider,
                synced: result.synced,
            });
            return result;
        },
        {
            connection: makeConnection(env),
            concurrency: 5,
            limiter: { max: 20, duration: 60_000 },
        },
    );
    for (const [queue, worker] of [
        [QUEUE_ALL, allWorker],
        [QUEUE_ACCOUNT, accountWorker],
    ] as const) {
        let lastConnectionErrorAt = 0;
        worker.on('failed', (job) => {
            logger.warn('email queue delivery failed', {
                queue,
                jobId: job?.id,
                userId: job?.data.userId,
                attempt: job?.attemptsMade,
            });
        });
        worker.on('error', () => {
            const now = Date.now();
            if (now - lastConnectionErrorAt < 10_000) return;
            lastConnectionErrorAt = now;
            logger.error('email worker connection error', { queue });
        });
    }
    await Promise.all([
        allWorker.waitUntilReady(),
        accountWorker.waitUntilReady(),
    ]);
    return {
        names: [QUEUE_ALL, QUEUE_ACCOUNT],
        close: async () => {
            await Promise.all([allWorker.close(), accountWorker.close()]);
        },
    };
}

export async function configureEmailSchedule(env: WorkerEnv) {
    const queue = createAllQueue(env);
    try {
        await Promise.all([
            queue.removeJobScheduler('cron-sync-all'),
            queue.removeJobScheduler('worker-email-sync-all'),
        ]);
        if (env.SCHEDULE_OWNER !== 'worker') return false;
        await queue.upsertJobScheduler(
            'worker-email-sync-all',
            { every: env.SYNC_INTERVAL_MINUTES * 60_000 },
            { name: 'sync-all', data: { triggeredBy: 'cron' } },
        );
    } finally {
        await queue.close();
    }
    return true;
}
