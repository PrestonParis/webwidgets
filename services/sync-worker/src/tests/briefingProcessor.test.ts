import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { createBriefingProcessor } from '../briefings/briefingProcessor.js';
import { workerEnvSchema } from '../env.js';
import type { V1JobEnvelope } from '../v1/contracts.js';

const originalFetch = globalThis.fetch;
const env = workerEnvSchema.parse({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    REDIS_URL: 'redis://localhost:6379',
    WEB_APP_URL: 'https://webwidgets.example.com',
    WORKER_API_TOKEN: 'test-worker-token-at-least-32-characters',
});
const envelope: V1JobEnvelope = {
    version: 1,
    jobId: '10000000-0000-4000-8000-000000000001',
    userId: '20000000-0000-4000-8000-000000000002',
    correlationId: 'briefing-test',
    idempotencyKey: 'briefing:on-demand:test',
    queue: 'analysis',
    task: {
        kind: 'briefing.generate',
        trigger: 'on_demand',
        coveredFrom: '2026-08-23T12:00:00.000Z',
        coveredTo: '2026-08-24T12:00:00.000Z',
    },
};

void describe('briefing processor', () => {
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    void it('calls the authenticated web generation boundary', async () => {
        let request: RequestInit | undefined;
        globalThis.fetch = async (_input, init) => {
            request = init;
            return Response.json({
                briefingId: envelope.jobId,
                status: 'ready',
            });
        };
        const result = await createBriefingProcessor(env)({
            envelope,
            dryRun: false,
        });
        assert.equal(request?.headers instanceof Headers, false);
        assert.match(
            JSON.stringify(request?.headers),
            /Bearer test-worker-token/,
        );
        assert.deepEqual(result, {
            briefingId: envelope.jobId,
            status: 'ready',
        });
    });

    void it('does not call external services during dry-run', async () => {
        globalThis.fetch = () => Promise.reject(new Error('unexpected fetch'));
        const result = await createBriefingProcessor(env)({
            envelope,
            dryRun: true,
        });
        assert.deepEqual(result, {
            dryRun: true,
            trigger: 'on_demand',
            coveredFrom: '2026-08-23T12:00:00.000Z',
            coveredTo: '2026-08-24T12:00:00.000Z',
        });
    });
});
