import { Queue, type ConnectionOptions } from 'bullmq';
import type { WorkerEnv } from './env.js';

export const QUEUE_ACCOUNT = 'email-sync-account';
export const QUEUE_ALL = 'email-sync-all';

export function makeConnection(env: WorkerEnv): ConnectionOptions {
    return { url: env.REDIS_URL, maxRetriesPerRequest: null };
}

export interface SyncAccountPayload {
    userId: string;
    accountId: string;
    provider: 'google' | 'microsoft';
}

export interface SyncAllPayload {
    triggeredBy: 'cron' | 'manual' | 'user-connect';
    userId?: string;
}

export function createAccountQueue(env: WorkerEnv) {
    return new Queue<SyncAccountPayload>(QUEUE_ACCOUNT, {
        connection: makeConnection(env),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: { age: 30 * 24 * 60 * 60, count: 200 },
            removeOnFail: { age: 90 * 24 * 60 * 60, count: 500 },
        },
    });
}

export function createAllQueue(env: WorkerEnv) {
    return new Queue<SyncAllPayload>(QUEUE_ALL, {
        connection: makeConnection(env),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: { age: 30 * 24 * 60 * 60, count: 50 },
            removeOnFail: { age: 90 * 24 * 60 * 60, count: 100 },
        },
    });
}
