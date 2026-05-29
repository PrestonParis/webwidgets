import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@/lib/observability/sentry', () => ({
    captureError: vi.fn(),
}));

const envBackup = { ...process.env };

describe('n8nClient', () => {
    beforeEach(() => {
        process.env = { ...envBackup };
        process.env.N8N_BASE_URL = 'https://n8n.example.com';
        process.env.N8N_API_KEY = 'secret-key';
        process.env.N8N_TIMEOUT_MS = '10000';
        vi.restoreAllMocks();
    });

    it('validates payloads before sending', async () => {
        const fetchImpl = vi.fn<typeof fetch>();
        const { triggerN8nWorkflow } = await import('@/lib/n8n/n8nClient');

        const result = await triggerN8nWorkflow(
            {
                workflowKey: 'email_ingestion',
                webhookPath: '/webhook/test',
                payload: { userId: 123 as unknown as string },
            },
            z.object({ userId: z.string() }),
            { fetchImpl },
        );

        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('WORKFLOW_TRIGGER_FAILED');
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('returns a normalized timeout error', async () => {
        const fetchImpl = vi.fn<typeof fetch>(async () => {
            throw new DOMException('aborted', 'AbortError');
        });
        const { triggerN8nWorkflow } = await import('@/lib/n8n/n8nClient');

        const result = await triggerN8nWorkflow(
            {
                workflowKey: 'email_ingestion',
                webhookPath: '/webhook/test',
                payload: { userId: 'user-1' },
            },
            z.object({ userId: z.string() }),
            { fetchImpl },
        );

        expect(result).toMatchObject({
            ok: false,
            workflowKey: 'email_ingestion',
            error: { code: 'N8N_TIMEOUT' },
        });
    });

    it('returns run id on successful trigger', async () => {
        const fetchImpl = vi.fn<typeof fetch>(
            async () =>
                new Response(JSON.stringify({ executionId: 'exec-1' }), {
                    status: 200,
                }),
        );
        const { triggerN8nWorkflow } = await import('@/lib/n8n/n8nClient');

        const result = await triggerN8nWorkflow(
            {
                workflowKey: 'email_ingestion',
                webhookPath: '/webhook/test',
                payload: { userId: 'user-1' },
                idempotencyKey: 'idem-1',
            },
            z.object({ userId: z.string() }),
            { fetchImpl },
        );

        expect(result).toEqual({
            ok: true,
            workflowKey: 'email_ingestion',
            runId: 'exec-1',
        });
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://n8n.example.com/webhook/test',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer secret-key',
                    'Idempotency-Key': 'idem-1',
                }),
            }),
        );
    });
});
