import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { captureError } from '@/lib/observability/sentry';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { N8nError } from '@/lib/n8n/n8nErrors';
import { verifyN8nWebhook } from '@/lib/n8n/verifyN8nWebhook';
import { handleN8nWebhookEvent } from '@/features/workflows/server/workflowService';
import { workflowCallbackSchema } from '@/lib/workflowActions/contracts';

export async function POST(req: Request): Promise<Response> {
    const startedAt = performance.now();
    let eventType = 'unknown';

    try {
        verifyN8nWebhook(req.headers);
        const body: unknown = await req.json();
        if (body && typeof body === 'object' && 'type' in body) {
            eventType = String((body as { type: unknown }).type);
        }
        const db = createAdminClient();
        const callback = workflowCallbackSchema.safeParse(body);
        if (callback.success) {
            const saved = await db.rpc('record_workflow_callback', {
                p_callback_id: callback.data.callbackId,
                p_user_id: callback.data.payload.userId,
                p_request_id: callback.data.payload.actionRequestId,
                p_job_id: callback.data.payload.jobId,
                p_idempotency_key: callback.data.payload.idempotencyKey,
                p_run_id: callback.data.payload.runId,
                p_status:
                    callback.data.type === 'workflow.completed'
                        ? 'completed'
                        : 'failed',
                p_result: callback.data.payload.result,
            });
            if (saved.error) throw new Error('workflow_callback_rejected');
            return NextResponse.json({
                ok: true,
                eventType: callback.data.type,
                replayed: saved.data === false,
            });
        }
        const result = await handleN8nWebhookEvent(db, body);
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
