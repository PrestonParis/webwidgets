import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { emailRequestSchema } from '@/lib/emailActions/receipts';
import { emailActionError, requireEmailMutation } from '../_lib/http';

export async function POST(request: Request) {
    try {
        requireEmailMutation(request);
        const { supabaseAdmin, userId } = await createCredentialClients();
        const input = z
            .strictObject({ actionRequestId: z.uuid() })
            .parse(await request.json());
        const [result, dispatch] = await Promise.all([
            supabaseAdmin
                .from('action_requests')
                .select('*')
                .eq('id', input.actionRequestId)
                .eq('user_id', userId)
                .single(),
            supabaseAdmin
                .from('email_action_dispatches')
                .select('state')
                .eq('action_request_id', input.actionRequestId)
                .eq('user_id', userId)
                .single(),
        ]);
        if (result.error || dispatch.error)
            throw new Error('email_reconciliation_unavailable');
        const action = emailRequestSchema.parse(result.data);
        if (
            action.approval_state !== 'approved' ||
            action.status === 'completed' ||
            action.status === 'failed'
        )
            throw new Error('email_reconciliation_unavailable');
        // A separate, minute-bounded queue entry can only read after the original reservation.
        const receipt = await enqueueTaskAction({
            userId,
            actionRequestId: action.id,
            idempotencyKey: `reconcile:${action.id}:${Math.floor(Date.now() / 60_000)}`,
        });
        return NextResponse.json({ queued: true, jobId: receipt.jobId });
    } catch (error) {
        return emailActionError(error);
    }
}
