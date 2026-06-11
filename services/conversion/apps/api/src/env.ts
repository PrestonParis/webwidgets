import { z } from 'zod';

const envSchema = z.object({
    CONVERSION_API_PORT: z.coerce.number().int().positive().default(4010),
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
    CONVERSION_MAX_FILE_BYTES: z.coerce
        .number()
        .int()
        .positive()
        .default(52_428_800),
    CONVERSION_API_KEY: z
        .string()
        .optional()
        .transform((v) => (v === '' ? undefined : v)),
    S3_CONFIGURE_CORS: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    S3_ALLOWED_ORIGINS: z.string().default('*'),
    CONVERSION_OBJECT_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CLEANUP_INTERVAL_MS: z.coerce.number().int().positive().default(3_600_000),
    CONVERSION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    CONVERSION_RATE_LIMIT_WINDOW_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(60_000),
});

export const env = envSchema.parse(process.env);
