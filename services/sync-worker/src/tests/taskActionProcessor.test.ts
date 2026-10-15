import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuntimeLogger } from '../logger.js';
import { createTaskActionProcessor } from '../taskActions/taskActionProcessor.js';
import type { V1JobEnvelope } from '../v1/contracts.js';
import { WorkerTaskError } from '../v1/processors.js';

const envelope: V1JobEnvelope = {
    version: 1,
    jobId: '10000000-0000-4000-8000-000000000001',
    userId: '20000000-0000-4000-8000-000000000001',
    correlationId: '30000000-0000-4000-8000-000000000001',
    idempotencyKey: 'execute:30000000-0000-4000-8000-000000000001',
    queue: 'action',
    task: {
        kind: 'action.execute',
        actionRequestId: '30000000-0000-4000-8000-000000000001',
    },
};

const logger: RuntimeLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};

const verifiedOutput = {
    taskId: '40000000-0000-4000-8000-000000000001',
    title: 'Ship Prompt 13',
    notes: null,
    dueAt: null,
    completed: false,
    completedAt: null,
    verifiedUpdatedAt: '2026-08-27T18:00:00.000Z',
};

function clientWithRpc(result: {
    data: unknown;
    error: { message: string } | null;
}) {
    const chain = {
        update: () => chain,
        eq: () => chain,
        neq: () => chain,
        select: () => chain,
        maybeSingle: () =>
            Promise.resolve({ data: { id: envelope.task.kind }, error: null }),
    };
    return {
        from: () => chain,
        rpc: () => Promise.resolve(result),
    } as unknown as SupabaseClient;
}

void describe('task action processor', () => {
    void it('returns only a verified canonical task receipt', async () => {
        const processor = createTaskActionProcessor(
            clientWithRpc({ data: verifiedOutput, error: null }),
            logger,
        );
        assert.deepEqual(
            await processor({ envelope, dryRun: false }),
            verifiedOutput,
        );
    });

    void it('blocks all task mutations in dry-run mode', async () => {
        const processor = createTaskActionProcessor(
            clientWithRpc({ data: verifiedOutput, error: null }),
            logger,
        );
        await assert.rejects(
            processor({ envelope, dryRun: true }),
            (error: unknown) =>
                error instanceof WorkerTaskError && !error.retryable,
        );
    });

    void it('fails when the database cannot return a verification receipt', async () => {
        const processor = createTaskActionProcessor(
            clientWithRpc({ data: { taskId: 'invalid' }, error: null }),
            logger,
        );
        await assert.rejects(
            processor({ envelope, dryRun: false }),
            (error: unknown) =>
                error instanceof WorkerTaskError && error.retryable,
        );
    });

    void it('treats stale approval and concurrent edits as terminal conflicts', async () => {
        const processor = createTaskActionProcessor(
            clientWithRpc({
                data: null,
                error: { message: 'task_action_edit_conflict' },
            }),
            logger,
        );
        await assert.rejects(
            processor({ envelope, dryRun: false }),
            (error: unknown) =>
                error instanceof WorkerTaskError && !error.retryable,
        );
    });
});
