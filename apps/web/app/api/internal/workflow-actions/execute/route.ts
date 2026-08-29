import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    workflowExecutionSchema,
    executeApprovedWorkflow,
} from '@/app/api/workflow-actions/_lib/executor';
export const maxDuration = 60;
function authorized(request: Request) {
    const expected = process.env.WORKER_API_TOKEN;
    const supplied = request.headers
        .get('authorization')
        ?.replace(/^Bearer\s+/iu, '');
    if (!expected || !supplied) return false;
    const left = Buffer.from(expected),
        right = Buffer.from(supplied);
    return left.length === right.length && timingSafeEqual(left, right);
}
export async function POST(request: Request) {
    if (!authorized(request))
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (process.env.PROVIDER_ACTIONS_ENABLED !== 'true')
        return NextResponse.json(
            { error: 'provider_actions_not_enabled' },
            { status: 503 },
        );
    const parsed = workflowExecutionSchema.safeParse(
        await request.json().catch(() => null),
    );
    if (!parsed.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        return NextResponse.json(
            await executeApprovedWorkflow(createAdminClient(), parsed.data),
        );
    } catch {
        return NextResponse.json(
            { error: 'workflow_execution_unconfirmed' },
            { status: 409 },
        );
    }
}
