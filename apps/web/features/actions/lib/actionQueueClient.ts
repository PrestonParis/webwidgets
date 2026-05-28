import { Queue, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { getLogger } from '@/lib/observability/logger';
import {
    queuedActionJobSchema,
    serializeActionPayload,
    type ActionRequestEnvelope,
    type QueuedActionJob,
} from '@/features/actions/lib/schemas/actionPayloadSchemas';

export const actionQueueName = 'unified-action-engine';

const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
};

let connection: IORedis | null = null;
let queue: Queue<QueuedActionJob> | null = null;

export function getRedisConnection() {
    if (!process.env.REDIS_URL) return null;
    if (!connection) {
        connection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            retryStrategy: (times) =>
                times > 3 ? null : Math.min(times * 200, 2000),
        });
        connection.on('error', () => {});
    }
    if (connection.status === 'end') return null;
    return connection;
}

export function getActionQueue() {
    const redis = getRedisConnection();
    if (!redis) return null;
    queue ??= new Queue<QueuedActionJob>(actionQueueName, {
        connection: redis,
        defaultJobOptions,
    });
    return queue;
}

export async function enqueueActionJob(
    envelope: ActionRequestEnvelope,
    userId: string,
) {
    const actionQueue = getActionQueue();
    if (!actionQueue) {
        getLogger({
            component: 'action-queue',
            actionId: envelope.actionId,
        }).warn('REDIS_URL missing; action queue unavailable');
        return null;
    }

    const job = queuedActionJobSchema.parse({
        serializedEnvelope: serializeActionPayload(envelope),
        userId,
        queuedAt: new Date(),
    });
    try {
        return await actionQueue.add(envelope.actionId, job);
    } catch (error) {
        getLogger({
            component: 'action-queue',
            actionId: envelope.actionId,
        }).warn(
            { err: error },
            'Action queue unavailable; job was not enqueued',
        );
        return null;
    }
}
