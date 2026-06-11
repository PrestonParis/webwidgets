import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';
import { env } from './env.js';
import { processDocumentJob } from './processors/documentProcessor.js';
import {
    getJob,
    markCompleted,
    markFailed,
    markProcessing,
} from './services/jobsRepository.js';

const logger = pino();
const documentQueueName = 'conversion-documents';
const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    documentQueueName,
    async (bullJob) => {
        const jobId = String(bullJob.data?.jobId ?? '');
        if (!jobId) throw new Error('Missing conversion jobId.');

        await markProcessing(jobId);
        const job = await getJob(jobId);
        if (!job) throw new Error(`Conversion job ${jobId} not found.`);

        const log = logger.child({ jobId, bullJobId: bullJob.id });
        const queueDurationMs = Date.now() - new Date(job.createdAt).getTime();
        log.info(
            {
                queueDurationMs,
                fileSizeBytes: job.fileSizeBytes,
                sourceExtension: job.sourceExtension,
                targetExtension: job.targetExtension,
            },
            'conversion processing started',
        );

        const startMs = Date.now();
        try {
            const { outputObjectKey, outputSizeBytes } =
                await processDocumentJob(job);
            const processingDurationMs = Date.now() - startMs;
            await markCompleted(jobId, outputObjectKey);
            log.info(
                {
                    processingDurationMs,
                    fileSizeBytes: job.fileSizeBytes,
                    outputSizeBytes,
                    outputObjectKey,
                },
                'conversion completed',
            );
            return { outputObjectKey, outputSizeBytes, processingDurationMs };
        } catch (error) {
            const processingDurationMs = Date.now() - startMs;
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown conversion failure.';
            await markFailed(jobId, message);
            log.error(
                {
                    processingDurationMs,
                    fileSizeBytes: job.fileSizeBytes,
                    error: message,
                },
                'conversion failed',
            );
            throw error;
        }
    },
    {
        connection,
        concurrency: env.WORKER_CONCURRENCY,
        // Lock duration must exceed the slowest conversion. Jobs not renewed within
        // this window are considered stalled and re-queued up to maxStalledCount times.
        lockDuration: env.WORKER_LOCK_DURATION_MS,
        stalledInterval: 30_000,
        maxStalledCount: 2,
    },
);

worker.on('failed', (job, error) => {
    logger.error(
        { bullJobId: job?.id, error: error.message },
        'job failed after all retries',
    );
});

logger.info(
    { queue: documentQueueName, concurrency: env.WORKER_CONCURRENCY },
    'document worker started',
    // To scale horizontally: run additional worker-docs instances pointing at the same Redis.
    // BullMQ distributes jobs across all connected workers automatically.
);
