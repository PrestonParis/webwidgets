import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Queue name must match the sync-worker's QUEUE_ALL constant.
const QUEUE_ALL = 'email-sync-all';

interface SyncAllPayload {
    triggeredBy: 'cron' | 'manual' | 'user-connect';
    userId?: string;
}

let connection: IORedis | null = null;
let queue: Queue<SyncAllPayload> | null = null;

function getConnection(): IORedis | null {
    if (!process.env.REDIS_URL) return null;
    if (!connection) {
        connection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            // Fail fast in the web process — don't queue writes while Redis is down.
            retryStrategy: (times) =>
                times > 3 ? null : Math.min(times * 200, 2000),
            enableOfflineQueue: false,
        });
        // Suppress unhandled rejections from orphaned connections on hot-reload.
        connection.on('error', () => {});
    }
    return connection;
}

function getQueue(): Queue<SyncAllPayload> | null {
    const redis = getConnection();
    if (!redis) return null;
    queue ??= new Queue<SyncAllPayload>(QUEUE_ALL, { connection: redis });
    return queue;
}

export async function triggerUserSync(userId: string): Promise<boolean> {
    const q = getQueue();
    if (!q) return false;
    try {
        await q.add(
            'sync-all',
            { triggeredBy: 'user-connect', userId },
            { priority: 1, jobId: `user-sync-${userId}` },
        );
        return true;
    } catch {
        return false;
    }
}
