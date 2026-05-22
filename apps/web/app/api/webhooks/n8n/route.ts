import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { captureError } from '@/lib/observability/sentry';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { N8nError } from '@/lib/n8n/n8nErrors';
import { verifyN8nWebhook } from '@/lib/n8n/verifyN8nWebhook';
import { handleN8nWebhookEvent } from '@/features/workflows/server/workflowService';

export async function POST(req: Request): Promise<Response> {
    const startedAt = performance.now();
    let eventType = 'unknown';

    try {
        verifyN8nWebhook(req.headers);
        const body: unknown = await req.json();
        if (body && typeof body === 'object' && 'type' in body) {
            eventType = String((body as { type: unknown }).type);
        }
        const result = await handleN8nWebhookEvent(createAdminClient(), body);
        return NextResponse.json({ ok: true, eventType: result.eventType });
    } catch (err) {
        const status =
            err instanceof N8nError && err.statusCode ? err.statusCode : 400;
        if (!(err instanceof N8nError || err instanceof ZodError)) {
            captureError(err, {
                operation: 'n8nWebhook',
                feature: 'workflows',
                tags: { eventType },
                extra: {
                    durationMs: Math.round(performance.now() - startedAt),
                },
            });
        }
        return NextResponse.json(
            {
                ok: false,
                error: {
                    code: 'N8N_WEBHOOK_INVALID',
                    message: 'Invalid workflow webhook.',
                },
            },
            { status },
        );
    }
}
