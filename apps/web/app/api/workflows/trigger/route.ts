import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { Json } from '@/types/supabase';
import { captureError } from '@/lib/observability/sentry';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { workflowTriggerRequestSchema } from '@/features/workflows/schemas/workflows';
import { triggerWorkflow } from '@/features/workflows/server/workflowService';

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = workflowTriggerRequestSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid workflow request' },
                { status: 400 },
            );
        }

        const result = await triggerWorkflow(supabase, {
            workflowKey: parsed.data.workflowKey,
            userId,
            payload: parsed.data.payload as Json,
            ...(parsed.data.idempotencyKey
                ? { idempotencyKey: parsed.data.idempotencyKey }
                : {}),
        });

        return NextResponse.json(result, {
            status: result.status === 'failed' ? 502 : 202,
        });
    } catch (err) {
        if (!(err instanceof ZodError)) {
            captureError(err, {
                operation: 'workflowTriggerRoute',
                feature: 'workflows',
            });
        }
        return NextResponse.json(
            {
                error: {
                    code: 'WORKFLOW_TRIGGER_FAILED',
                    message: 'Workflow could not be queued.',
                },
            },
            { status: 500 },
        );
    }
}
