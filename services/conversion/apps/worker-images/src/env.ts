import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.enum(['true','false']).default('true').transform(v => v === 'true'),
  IMAGE_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  IMAGE_CONVERSION_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  IMAGE_MAX_OUTPUT_BYTES: z.coerce.number().int().positive().default(104_857_600),
  IMAGE_JPEG_QUALITY: z.coerce.number().int().min(1).max(100).default(90),
  IMAGE_WEBP_QUALITY: z.coerce.number().int().min(1).max(100).default(85),
  // Env var: 'true' | 'false'. Default false = strip metadata (privacy/safety default).
  IMAGE_PRESERVE_METADATA: z.enum(['true','false']).default('false').transform(v => v === 'true'),
  WORKER_LOCK_DURATION_MS: z.coerce.number().int().positive().default(120_000),
});

export const env = envSchema.parse(process.env);
