import { z } from 'zod';

const schema = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    REDIS_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    MICROSOFT_CLIENT_ID: z.string().min(1),
    MICROSOFT_CLIENT_SECRET: z.string().min(1),
    MICROSOFT_TENANT_ID: z.string().default('common'),
    // How many emails to fetch per account per sync cycle
    SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(200).default(50),
    // Cron: how often to sync all users (default every 10 minutes)
    SYNC_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid sync-worker env:');
    for (const issue of parsed.error.issues) {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;
