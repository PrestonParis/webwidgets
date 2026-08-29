import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { calendarActionError, requireCalendarMutation } from '../_lib/http';
export async function POST(request: Request) {
    try {
        requireCalendarMutation(request);
        const { supabaseAdmin, userId } = await createCredentialClients();
        const body: unknown = await request.json();
        const { id } = z.strictObject({ id: z.uuid() }).parse(body);
        const [action, dispatch] = await Promise.all([
            supabaseAdmin
                .from('action_requests')
                .select('approval_state,status')
                .eq('id', id)
                .eq('user_id', userId)
                .single(),
            supabaseAdmin
                .from('calendar_action_dispatches')
                .select('state')
                .eq('action_request_id', id)
                .eq('user_id', userId)
                .single(),
        ]);
        const actionRow = z
            .object({ approval_state: z.string(), status: z.string() })
            .safeParse(action.data);
        if (
            action.error ||
            dispatch.error ||
            !actionRow.success ||
            actionRow.data.approval_state !== 'approved' ||
            ['completed', 'failed'].includes(actionRow.data.status)
        )
            throw new Error('calendar_reconciliation_unavailable');
        const result = await enqueueTaskAction({
            userId,
            actionRequestId: id,
            idempotencyKey: `reconcile:${id}:${Math.floor(Date.now() / 60_000)}`,
        });
        return NextResponse.json({ queued: true, jobId: result.jobId });
    } catch (error) {
        return calendarActionError(error);
    }
}
