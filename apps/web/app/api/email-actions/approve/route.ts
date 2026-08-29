import { NextResponse } from 'next/server';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { emailApprovalSchema } from '@/lib/emailActions/contracts';
import { emailRequestSchema } from '@/lib/emailActions/receipts';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { emailActionError, requireEmailMutation } from '../_lib/http';

export async function POST(request: Request) {
    try {
        requireEmailMutation(request);
        const { supabase, userId } = await createCredentialClients();
        const input = emailApprovalSchema.parse(await request.json());
        const result = await supabase.rpc('approve_email_action', {
            p_request_id: input.actionRequestId,
            p_action_id: input.actionId,
            p_payload: input.message,
            p_payload_hash: input.payloadHash,
            p_payload_version: input.payloadVersion,
            p_decision: input.decision,
        });
        if (result.error) throw new Error(result.error.message);
        const approved = emailRequestSchema.parse(result.data);
        if (
            input.decision === 'denied' ||
            approved.status === 'completed' ||
            approved.status === 'failed'
        )
            return NextResponse.json({ request: approved, queued: false });
        const receipt = await enqueueTaskAction({
            userId,
            actionRequestId: approved.id,
            idempotencyKey: `execute:${approved.id}`,
        }).catch(() => null);
        return NextResponse.json({
            request: approved,
            queued: receipt !== null,
        });
    } catch (error) {
        return emailActionError(error);
    }
}
