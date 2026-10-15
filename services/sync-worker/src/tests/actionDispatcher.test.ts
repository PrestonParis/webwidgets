import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { workerEnvSchema } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { createActionDispatcher } from '../taskActions/actionDispatcher.js';
import type { V1JobEnvelope } from '../v1/contracts.js';
import { WorkerTaskError } from '../v1/processors.js';

const originalFetch = globalThis.fetch;
const env = workerEnvSchema.parse({
    SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-role',
    REDIS_URL: 'redis://fixture',
    WEB_APP_URL: 'https://app.example.invalid',
    WORKER_API_TOKEN: 'x'.repeat(32),
});
const logger: RuntimeLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};
const envelope: V1JobEnvelope = {
    version: 1,
    jobId: '10000000-0000-4000-8000-000000000001',
    userId: '20000000-0000-4000-8000-000000000001',
    correlationId: '30000000-0000-4000-8000-000000000001',
    idempotencyKey: 'execute:30000000-0000-4000-8000-000000000001',
    queue: 'action',
    task: {
        kind: 'action.execute',
        actionRequestId: '40000000-0000-4000-8000-000000000001',
    },
};
function actionClient(actionId: string) {
    const chain = {
        select: () => chain,
        eq: () => chain,
        single: () =>
            Promise.resolve({ data: { action_id: actionId }, error: null }),
    };
    return {
        from: () => chain,
        rpc: () => Promise.resolve({ data: true, error: null }),
    } as unknown as SupabaseClient;
}

afterEach(() => {
    globalThis.fetch = originalFetch;
});

void describe('provider action dispatcher', () => {
    void it('routes approved workflow jobs to the protected workflow executor', async () => {
        let requested = '';
        globalThis.fetch = async (input) => {
            requested = String(input);
            return new Response(
                JSON.stringify({
                    state: 'accepted',
                    providerObjectId: 'n8n-run-1',
                    code: 'workflow_dispatch_verified',
                }),
                { status: 200 },
            );
        };
        const processor = createActionDispatcher(
            actionClient('automation.run'),
            env,
            logger,
        );
        const result = await processor({ envelope, dryRun: false });
        assert.equal(
            requested,
            'https://app.example.invalid/api/internal/workflow-actions/execute',
        );
        assert.deepEqual(result, {
            state: 'accepted',
            providerObjectId: 'n8n-run-1',
            code: 'workflow_dispatch_verified',
        });
    });

    void it('never invokes a provider endpoint in dry-run mode', async () => {
        globalThis.fetch = async () => {
            throw new Error('provider endpoint must not be called');
        };
        const processor = createActionDispatcher(
            actionClient('email.send'),
            env,
            logger,
        );
        await assert.rejects(
            processor({ envelope, dryRun: true }),
            (error: unknown) =>
                error instanceof WorkerTaskError && !error.retryable,
        );
    });

    void it('stops an automation action when pause-all wins the execution race', async () => {
        const client = actionClient('tasks.create') as unknown as {
            rpc: () => Promise<{ data: boolean; error: null }>;
        };
        client.rpc = () => Promise.resolve({ data: false, error: null });
        const processor = createActionDispatcher(
            client as unknown as SupabaseClient,
            env,
            logger,
        );
        await assert.rejects(
            processor({ envelope, dryRun: false }),
            (error: unknown) =>
                error instanceof WorkerTaskError &&
                error.code === 'automation_paused' &&
                !error.retryable,
        );
    });
});
