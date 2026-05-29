import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleN8nWebhookEvent = vi.fn();

vi.mock('@/lib/supabase/adminClient', () => ({
    createAdminClient: () => ({ from: vi.fn() }),
}));

vi.mock('@/features/workflows/server/workflowService', () => ({
    handleN8nWebhookEvent: (...args: unknown[]) =>
        handleN8nWebhookEvent(...args),
}));

vi.mock('@/lib/observability/sentry', () => ({
    captureError: vi.fn(),
}));

describe('n8n webhook route', () => {
    beforeEach(() => {
        process.env.N8N_WEBHOOK_SECRET = 'expected-secret-value';
        delete process.env.N8N_WEBHOOK_USER_AGENT;
        handleN8nWebhookEvent.mockReset();
    });

    it('rejects invalid secret', async () => {
        const { POST } = await import('@/app/api/webhooks/n8n/route');
        const response = await POST(
            new Request('https://app.test/api/webhooks/n8n', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'email.ingested',
                    payload: { messageId: 'm1' },
                }),
            }),
        );

        expect(response.status).toBe(401);
        expect(handleN8nWebhookEvent).not.toHaveBeenCalled();
    });

    it('rejects invalid payload', async () => {
        const { POST } = await import('@/app/api/webhooks/n8n/route');
        const response = await POST(
            new Request('https://app.test/api/webhooks/n8n', {
                method: 'POST',
                headers: { 'x-n8n-webhook-secret': 'expected-secret-value' },
                body: JSON.stringify({ type: 'email.ingested', payload: {} }),
            }),
        );

        expect(response.status).toBe(400);
    });

    it('routes a valid event', async () => {
        handleN8nWebhookEvent.mockResolvedValue({
            ok: true,
            eventType: 'email.ingested',
        });
        const { POST } = await import('@/app/api/webhooks/n8n/route');
        const response = await POST(
            new Request('https://app.test/api/webhooks/n8n', {
                method: 'POST',
                headers: { 'x-n8n-webhook-secret': 'expected-secret-value' },
                body: JSON.stringify({
                    type: 'email.ingested',
                    payload: { userId: 'user-1', messageId: 'msg-1' },
                }),
            }),
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            eventType: 'email.ingested',
        });
        expect(handleN8nWebhookEvent).toHaveBeenCalledOnce();
    });
});
