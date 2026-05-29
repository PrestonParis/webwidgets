import { beforeEach, describe, expect, it, vi } from 'vitest';

const triggerN8nWorkflow = vi.fn();
const createdJobs: Array<{
    id: string;
    userId: string;
    type: string;
    metadata: unknown;
}> = [];
const updatedJobs: Array<{
    jobId: string;
    status: string;
    failureReason?: string;
}> = [];

vi.mock('@/lib/n8n/n8nClient', () => ({
    triggerN8nWorkflow: (...args: unknown[]) => triggerN8nWorkflow(...args),
}));

vi.mock('@/features/jobs/services/jobService', () => ({
    createJob: async (
        _supabase: unknown,
        userId: string,
        type: string,
        metadata: unknown,
    ) => {
        const job = {
            id: `job-${createdJobs.length + 1}`,
            userId,
            type,
            metadata,
        };
        createdJobs.push(job);
        return job;
    },
    updateJobStatus: async (
        _supabase: unknown,
        _userId: string,
        jobId: string,
        status: string,
        failureReason?: string,
    ) => {
        updatedJobs.push({
            jobId,
            status,
            ...(failureReason ? { failureReason } : {}),
        });
        return { id: jobId, status };
    },
}));

describe('workflowService', () => {
    beforeEach(() => {
        triggerN8nWorkflow.mockReset();
        createdJobs.length = 0;
        updatedJobs.length = 0;
    });

    it('returns normalized errors when n8n trigger fails', async () => {
        triggerN8nWorkflow.mockResolvedValue({
            ok: false,
            workflowKey: 'email_ingestion',
            error: {
                code: 'N8N_TIMEOUT',
                message: 'Workflow service timed out.',
            },
        });
        const { triggerWorkflow } =
            await import('@/features/workflows/server/workflowService');

        const result = await triggerWorkflow({} as never, {
            workflowKey: 'email_ingestion',
            userId: 'user-1',
            payload: { userId: 'user-1', source: 'gmail' },
        });

        expect(result).toMatchObject({
            status: 'failed',
            workflowKey: 'email_ingestion',
            jobId: 'job-1',
            error: { code: 'N8N_TIMEOUT' },
        });
        expect(updatedJobs).toContainEqual({
            jobId: 'job-1',
            status: 'failed',
            failureReason: 'Workflow service timed out.',
        });
    });

    it('records valid webhook events through domain services', async () => {
        const { handleN8nWebhookEvent } =
            await import('@/features/workflows/server/workflowService');

        const result = await handleN8nWebhookEvent({} as never, {
            type: 'finance.synced',
            payload: {
                userId: 'user-1',
                transactionCount: 12,
                syncedAt: '2026-05-19T12:00:00.000Z',
            },
        });

        expect(result).toEqual({
            ok: true,
            eventType: 'finance.synced',
            jobId: 'job-1',
        });
        expect(createdJobs[0]).toMatchObject({
            userId: 'user-1',
            type: 'finance_categorization',
        });
    });
});
