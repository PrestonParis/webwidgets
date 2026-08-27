import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createReadinessChecker } from '../health.js';
import { workerEnvSchema } from '../env.js';
import { V1_QUEUE_NAMES } from '../v1/contracts.js';

void describe('V1 runtime readiness and configuration', () => {
    void it('reports ready only when Redis and Supabase are available', async () => {
        const healthy = createReadinessChecker({
            redis: () => Promise.resolve(true),
            supabase: () => Promise.resolve(true),
        });
        const redisDown = createReadinessChecker({
            redis: () => Promise.resolve(false),
            supabase: () => Promise.resolve(true),
        });
        assert.deepEqual(await healthy(), {
            ready: true,
            redis: true,
            supabase: true,
        });
        assert.deepEqual(await redisDown(), {
            ready: false,
            redis: false,
            supabase: true,
        });
    });

    void it('registers all four owned V1 queue names', () => {
        assert.deepEqual(Object.keys(V1_QUEUE_NAMES), [
            'ingestion',
            'analysis',
            'schedule',
            'action',
        ]);
    });

    void it('defaults to a dark deployment with Vercel schedule ownership', () => {
        const env = workerEnvSchema.parse({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            REDIS_URL: 'redis://localhost:6379',
            WEB_APP_URL: 'https://webwidgets.example.com',
            WORKER_API_TOKEN: 'test-worker-token-at-least-32-characters',
        });
        assert.equal(env.WORKER_DRY_RUN, true);
        assert.equal(env.EMAIL_SYNC_ENABLED, false);
        assert.equal(env.PROVIDER_SYNC_ENABLED, false);
        assert.equal(env.SCHEDULE_OWNER, 'vercel');
        assert.equal(env.V1_QUEUES_ENABLED, true);
    });

    void it('rejects worker schedule ownership when email sync is disabled', () => {
        const result = workerEnvSchema.safeParse({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            REDIS_URL: 'redis://localhost:6379',
            WEB_APP_URL: 'https://webwidgets.example.com',
            WORKER_API_TOKEN: 'test-worker-token-at-least-32-characters',
            SCHEDULE_OWNER: 'worker',
        });
        assert.equal(result.success, false);
    });

    void it('requires refresh credentials before provider sync is enabled', () => {
        const result = workerEnvSchema.safeParse({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            REDIS_URL: 'redis://localhost:6379',
            WEB_APP_URL: 'https://webwidgets.example.com',
            WORKER_API_TOKEN: 'test-worker-token-at-least-32-characters',
            PROVIDER_SYNC_ENABLED: 'true',
        });
        assert.equal(result.success, false);
    });
});
