import { Queue, Worker, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { getLogger } from '@/lib/observability/logger';
import {
    deserializeActionPayload,
    queuedActionJobSchema,
    serializeActionPayload,
    type ActionRequestEnvelope,
    type QueuedActionJob,
} from '@/features/actions/schemas/actionSchemas';
import { executeUnifiedAction } from '@/features/actions/engine/actionEngine';
import { recordActionQueueLatency } from '@/features/actions/runtime/telemetry';

const queueName = 'unified-action-engine';
const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
};

let connection: IORedis | null = null;
let queue: Queue<QueuedActionJob> | null = null;

function getRedisConnection() {
    if (!process.env.REDIS_URL) return null;
    connection ??= new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });
    return connection;
}

export function getActionQueue() {
    const redis = getRedisConnection();
    if (!redis) return null;
    queue ??= new Queue<QueuedActionJob>(queueName, {
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
    return actionQueue.add(envelope.actionId, job);
}

export function createActionWorker() {
    const redis = getRedisConnection();
    if (!redis) return null;
    const log = getLogger({ component: 'action-worker' });

    const worker = new Worker<QueuedActionJob>(
        queueName,
        async (job) => {
            const data = queuedActionJobSchema.parse(job.data);
            const envelope = deserializeActionPayload(
                data.serializedEnvelope,
            ) as ActionRequestEnvelope;
            const executableEnvelope = {
                ...envelope,
                invocationMode: 'sync' as const,
            };
            const latencyMs = Date.now() - data.queuedAt.getTime();
            recordActionQueueLatency(executableEnvelope.actionId, latencyMs);
            log.info(
                {
                    jobId: job.id,
                    actionId: executableEnvelope.actionId,
                    latencyMs,
                },
                'queued action started',
            );
            return executeUnifiedAction(executableEnvelope, {
                userId: data.userId,
            });
        },
        { connection: redis },
    );

    worker.on('failed', (job, error) => {
        log.error(
            { err: error, jobId: job?.id, actionId: job?.name },
            'queued action failed',
        );
    });

    return worker;
}

export { queueName as actionQueueName };
