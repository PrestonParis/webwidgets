import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { env } from './env.js';

export const QUEUE_ACCOUNT = 'email-sync-account';
export const QUEUE_ALL = 'email-sync-all';

// Shared connection options — used by both this worker and the Next.js producer.
// The Next.js app reads REDIS_URL from its own env (same value).
export function makeConnection(): ConnectionOptions {
    return {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
    } as ConnectionOptions;
}

export interface SyncAccountPayload {
    userId: string;
    accountId: string;
    provider: 'google' | 'microsoft';
    email: string;
}

export interface SyncAllPayload {
    triggeredBy: 'cron' | 'manual' | 'user-connect';
    userId?: string; // If set, only sync this user
}

// Producer used both here and re-exported for Next.js to enqueue on-demand syncs.
let _accountQueue: Queue<SyncAccountPayload> | null = null;
let _allQueue: Queue<SyncAllPayload> | null = null;

export function getAccountQueue(): Queue<SyncAccountPayload> {
    _accountQueue ??= new Queue<SyncAccountPayload>(QUEUE_ACCOUNT, {
        connection: makeConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: 200,
            removeOnFail: 100,
        },
    });
    return _accountQueue;
}

export function getAllQueue(): Queue<SyncAllPayload> {
    _allQueue ??= new Queue<SyncAllPayload>(QUEUE_ALL, {
        connection: makeConnection(),
        defaultJobOptions: {
            attempts: 2,
            removeOnComplete: 10,
            removeOnFail: 20,
        },
    });
    return _allQueue;
}

export async function enqueueUserSync(userId: string): Promise<void> {
    await getAllQueue().add(
        'sync-all',
        { triggeredBy: 'user-connect', userId },
        { priority: 1, jobId: `user-sync-${userId}` },
    );
}
