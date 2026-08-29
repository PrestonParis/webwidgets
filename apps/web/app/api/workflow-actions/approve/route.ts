import { NextResponse } from 'next/server';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { workflowApprovalSchema } from '@/lib/workflowActions/contracts';
import { workflowRequestSchema } from '@/lib/workflowActions/receipts';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { requireWorkflowMutation, workflowActionError } from '../_lib/http';
export async function POST(request: Request) {
    try {
        requireWorkflowMutation(request);
        const { supabase, userId } = await createCredentialClients();
        const input = workflowApprovalSchema.parse(await request.json());
        const result = await supabase.rpc('approve_workflow_action', {
            p_request_id: input.actionRequestId,
            p_payload: input.workflow,
            p_payload_hash: input.payloadHash,
            p_payload_version: input.payloadVersion,
            p_decision: input.decision,
        });
        if (result.error) throw new Error(result.error.message);
        const approved = workflowRequestSchema.parse(result.data);
        if (input.decision === 'denied')
            return NextResponse.json({ request: approved, queued: false });
        if (['completed', 'failed'].includes(approved.status))
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
        return workflowActionError(error);
    }
}
