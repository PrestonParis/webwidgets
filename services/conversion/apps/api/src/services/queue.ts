import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../env.js';

export const documentQueueName = 'conversion-documents';
export const imageQueueName = 'conversion-images';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const documentQueue = new Queue(documentQueueName, { connection: redisConnection });
export const imageQueue = new Queue(imageQueueName, { connection: redisConnection });

const jobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};

export async function enqueueDocumentJob(jobId: string) {
  await documentQueue.add('convert-document', { jobId }, { jobId, ...jobOptions });
}

export async function enqueueImageJob(jobId: string) {
  await imageQueue.add('convert-image', { jobId }, { jobId, ...jobOptions });
}

export async function enqueueJob(jobId: string, kind: string) {
  if (kind === 'image') {
    return enqueueImageJob(jobId);
  }
  return enqueueDocumentJob(jobId);
}
