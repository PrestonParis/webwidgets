import type { FastifyBaseLogger } from 'fastify';
import { env } from '../env.js';
import { deleteJobObjects } from './storage.js';
import { deleteJobRecords, listExpiredJobs } from './jobsRepository.js';

export async function runCleanup(logger: FastifyBaseLogger): Promise<void> {
  const cutoff = new Date(Date.now() - env.CONVERSION_OBJECT_TTL_DAYS * 86_400_000);
  const jobs = await listExpiredJobs(cutoff);
  if (jobs.length === 0) return;

  let deleted = 0;
  let errors = 0;
  for (const job of jobs) {
    try {
      await deleteJobObjects(job.inputObjectKey, job.outputObjectKey);
      deleted++;
    } catch (err) {
      errors++;
      logger.warn({ jobId: job.id, err }, 'cleanup: failed to delete S3 objects');
    }
  }

  await deleteJobRecords(jobs.map((j) => j.id));
  logger.info({ deleted, errors, cutoff }, 'cleanup: finished');
}

export function startCleanupScheduler(logger: FastifyBaseLogger): void {
  const interval = setInterval(() => {
    runCleanup(logger).catch((err) => logger.error({ err }, 'cleanup: unhandled error'));
  }, env.CLEANUP_INTERVAL_MS);
  interval.unref();
  logger.info({ intervalMs: env.CLEANUP_INTERVAL_MS, ttlDays: env.CONVERSION_OBJECT_TTL_DAYS }, 'cleanup scheduler started');
}
