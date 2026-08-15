import {
    Queue,
    UnrecoverableError,
    Worker,
    type ConnectionOptions,
    type JobsOptions,
} from 'bullmq';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import {
    V1_QUEUE_NAMES,
    v1JobEnvelopeSchema,
    type V1JobEnvelope,
    type V1QueueKind,
} from './contracts.js';
import type { JobRunResult } from './jobRunner.js';
import { WorkerTaskError } from './processors.js';

const successfulRetentionSeconds = 30 * 24 * 60 * 60;
const failedRetentionSeconds = 90 * 24 * 60 * 60;

export const v1DefaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { age: successfulRetentionSeconds, count: 1_000 },
    removeOnFail: { age: failedRetentionSeconds, count: 5_000 },
};

export function makeRedisConnection(env: WorkerEnv): ConnectionOptions {
    return { url: env.REDIS_URL, maxRetriesPerRequest: null };
}

export interface V1WorkerSet {
    names: string[];
    close(): Promise<void>;
}

type Runner = (
    envelope: V1JobEnvelope,
    delivery: { attempt: number; queueJobId: string },
) => Promise<JobRunResult>;

function concurrencyFor(queue: V1QueueKind) {
    if (queue === 'action') return 2;
    if (queue === 'schedule') return 1;
    return 4;
}

function attachEvents(
    worker: Worker<V1JobEnvelope>,
    queue: V1QueueKind,
    logger: RuntimeLogger,
) {
    let lastConnectionErrorAt = 0;
    worker.on('failed', (job, error) => {
        const taskError = error instanceof WorkerTaskError ? error : undefined;
        logger.warn('queue delivery failed', {
            queue,
            jobId: job?.data.jobId,
            correlationId: job?.data.correlationId,
            failureCode: taskError?.code ?? 'queue_delivery_error',
            attempt: job?.attemptsMade,
        });
    });
    worker.on('error', () => {
        const now = Date.now();
        if (now - lastConnectionErrorAt < 10_000) return;
        lastConnectionErrorAt = now;
        logger.error('worker connection error', { queue });
    });
}

export async function startV1Workers(
    env: WorkerEnv,
    runner: Runner,
    logger: RuntimeLogger,
): Promise<V1WorkerSet> {
    const workers = Object.entries(V1_QUEUE_NAMES).map(([kind, name]) => {
        const queue = kind as V1QueueKind;
        const worker = new Worker<V1JobEnvelope>(
            name,
            async (job) => {
                const envelope = v1JobEnvelopeSchema.parse(job.data);
                if (envelope.queue !== queue) {
                    throw new UnrecoverableError('Queue kind mismatch');
                }
                try {
                    return await runner(envelope, {
                        attempt: job.attemptsMade + 1,
                        queueJobId: job.id ?? envelope.jobId,
                    });
                } catch (error) {
                    if (error instanceof WorkerTaskError && !error.retryable) {
                        throw new UnrecoverableError(error.safeDetail);
                    }
                    throw error;
                }
            },
            {
                connection: makeRedisConnection(env),
                concurrency: concurrencyFor(queue),
            },
        );
        attachEvents(worker, queue, logger);
        return worker;
    });
    await Promise.all(workers.map((worker) => worker.waitUntilReady()));
    return {
        names: Object.values(V1_QUEUE_NAMES),
        close: async () => {
            await Promise.all(workers.map((worker) => worker.close()));
        },
    };
}

export function createV1Queue(env: WorkerEnv, queue: V1QueueKind) {
    return new Queue<V1JobEnvelope>(V1_QUEUE_NAMES[queue], {
        connection: makeRedisConnection(env),
        defaultJobOptions: v1DefaultJobOptions,
    });
}
