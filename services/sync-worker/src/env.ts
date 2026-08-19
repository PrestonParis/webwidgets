import { z } from 'zod';

const booleanString = (defaultValue: 'true' | 'false') =>
    z
        .enum(['true', 'false'])
        .default(defaultValue)
        .transform((value) => value === 'true');

const optionalSecret = z.string().min(1).optional();

export const workerEnvSchema = z
    .object({
        SUPABASE_URL: z.string().url(),
        SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
        REDIS_URL: z.string().min(1),
        EMAIL_SYNC_ENABLED: booleanString('false'),
        PROVIDER_SYNC_ENABLED: booleanString('false'),
        V1_QUEUES_ENABLED: booleanString('true'),
        WORKER_DRY_RUN: booleanString('true'),
        SCHEDULE_OWNER: z.enum(['vercel', 'worker']).default('vercel'),
        GOOGLE_CLIENT_ID: optionalSecret,
        GOOGLE_CLIENT_SECRET: optionalSecret,
        MICROSOFT_CLIENT_ID: optionalSecret,
        MICROSOFT_CLIENT_SECRET: optionalSecret,
        MICROSOFT_TENANT_ID: z.string().default('common'),
        SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(200).default(50),
        SYNC_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(10),
        RSS_SCHEDULE_INTERVAL_MS: z.coerce
            .number()
            .int()
            .min(10_000)
            .default(60_000),
        RSS_SCHEDULE_BATCH_SIZE: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(25),
        PROVIDER_SCHEDULE_INTERVAL_MS: z.coerce
            .number()
            .int()
            .min(10_000)
            .default(60_000),
        PROVIDER_SCHEDULE_BATCH_SIZE: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(25),
        HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(10000),
        HEARTBEAT_INTERVAL_MS: z.coerce
            .number()
            .int()
            .min(5_000)
            .default(30_000),
        JOB_TIMEOUT_MS: z.coerce.number().int().min(1_000).default(120_000),
        SHUTDOWN_TIMEOUT_MS: z.coerce
            .number()
            .int()
            .min(1_000)
            .max(290_000)
            .default(110_000),
        WORKER_INSTANCE_ID: z.string().min(1).optional(),
        SMOKE_USER_ID: z.string().uuid().optional(),
        SMOKE_IDEMPOTENCY_KEY: z.string().min(1).max(700).optional(),
    })
    .superRefine((value, context) => {
        if (!value.EMAIL_SYNC_ENABLED && !value.PROVIDER_SYNC_ENABLED) return;
        const required = [
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'MICROSOFT_CLIENT_ID',
            'MICROSOFT_CLIENT_SECRET',
        ] as const;
        for (const key of required) {
            if (!value[key]) {
                context.addIssue({
                    code: 'custom',
                    path: [key],
                    message: `${key} is required when provider sync is enabled`,
                });
            }
        }
    })
    .superRefine((value, context) => {
        if (value.SCHEDULE_OWNER === 'worker' && !value.EMAIL_SYNC_ENABLED) {
            context.addIssue({
                code: 'custom',
                path: ['SCHEDULE_OWNER'],
                message: 'Worker schedule ownership requires email sync',
            });
        }
    });

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function loadWorkerEnv(input: NodeJS.ProcessEnv = process.env) {
    return workerEnvSchema.parse(input);
}
