import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  CONVERSION_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  // How many jobs this worker processes in parallel. Keep low on machines without
  // enough RAM for multiple LibreOffice instances (≥ 512 MB per instance).
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  // How long (ms) a job is locked before BullMQ considers it stalled.
  // Must be longer than the slowest expected conversion.
  WORKER_LOCK_DURATION_MS: z.coerce.number().int().positive().default(300_000),
  // Maximum size in bytes allowed for a conversion output file (default 100 MB).
  CONVERSION_MAX_OUTPUT_BYTES: z.coerce.number().int().positive().default(104_857_600)
});

export const env = envSchema.parse(process.env);
