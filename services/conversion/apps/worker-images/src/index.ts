import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';
import { env } from './env.js';
import { processImageJob } from './processors/imageProcessor.js';
import {
  getJob,
  markCompleted,
  markFailed,
  markProcessing
} from './services/jobsRepository.js';

const logger = pino();
const imageQueueName = 'conversion-images';
const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  imageQueueName,
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
        targetExtension: job.targetExtension
      },
      'image conversion processing started'
    );

    const startMs = Date.now();
    try {
      const { outputObjectKey, outputSizeBytes } = await processImageJob(job);
      const processingDurationMs = Date.now() - startMs;
      await markCompleted(jobId, outputObjectKey);
      log.info(
        {
          processingDurationMs,
          fileSizeBytes: job.fileSizeBytes,
          outputSizeBytes,
          outputObjectKey,
          sourceExtension: job.sourceExtension,
          targetExtension: job.targetExtension
        },
        'image conversion completed'
      );
      return { outputObjectKey, outputSizeBytes, processingDurationMs };
    } catch (error) {
      const processingDurationMs = Date.now() - startMs;
      const message = error instanceof Error ? error.message : 'Unknown conversion failure.';
      await markFailed(jobId, message);
      log.error(
        {
          processingDurationMs,
          fileSizeBytes: job.fileSizeBytes,
          error: message,
          sourceExtension: job.sourceExtension,
          targetExtension: job.targetExtension
        },
        'image conversion failed'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: env.IMAGE_WORKER_CONCURRENCY,
    lockDuration: env.WORKER_LOCK_DURATION_MS,
    stalledInterval: 30_000,
    maxStalledCount: 2
  }
);

worker.on('failed', (job, error) => {
  logger.error({ bullJobId: job?.id, error: error.message }, 'job failed after all retries');
});

logger.info(
  { queue: imageQueueName, concurrency: env.IMAGE_WORKER_CONCURRENCY },
  'image worker started'
  // To scale horizontally: run additional worker-images instances pointing at the same Redis.
  // BullMQ distributes jobs across all connected workers automatically.
);
