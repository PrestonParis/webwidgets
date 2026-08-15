import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createReadinessChecker } from '../health.js';
import { workerEnvSchema } from '../env.js';
import { V1_QUEUE_NAMES } from '../v1/contracts.js';

describe('V1 runtime readiness and configuration', () => {
    it('reports ready only when Redis and Supabase are available', async () => {
        const healthy = createReadinessChecker({
            redis: async () => true,
            supabase: async () => true,
        });
        const redisDown = createReadinessChecker({
            redis: async () => false,
            supabase: async () => true,
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

    it('registers all four owned V1 queue names', () => {
        assert.deepEqual(Object.keys(V1_QUEUE_NAMES), [
            'ingestion',
            'analysis',
            'schedule',
            'action',
        ]);
    });

    it('defaults to a dark deployment with Vercel schedule ownership', () => {
        const env = workerEnvSchema.parse({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            REDIS_URL: 'redis://localhost:6379',
        });
        assert.equal(env.WORKER_DRY_RUN, true);
        assert.equal(env.EMAIL_SYNC_ENABLED, false);
        assert.equal(env.SCHEDULE_OWNER, 'vercel');
        assert.equal(env.V1_QUEUES_ENABLED, true);
    });

    it('rejects worker schedule ownership when email sync is disabled', () => {
        const result = workerEnvSchema.safeParse({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
            REDIS_URL: 'redis://localhost:6379',
            SCHEDULE_OWNER: 'worker',
        });
        assert.equal(result.success, false);
    });
});
