import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { workflowRequestSchema } from '@/lib/workflowActions/receipts';
import { workflowReceiptSchema } from '@/lib/workflowActions/contracts';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { parseWorkflowParameters } from '@/lib/n8n/n8nSchemas';
import { triggerN8nWorkflow } from '@/lib/n8n/n8nClient';
export const workflowExecutionSchema = z.strictObject({
    userId: z.uuid(),
    actionRequestId: z.uuid(),
    jobId: z.uuid(),
});
const claimSchema = z.object({
    dispatchAllowed: z.boolean(),
    state: z.string(),
    providerObjectId: z.string().nullable(),
    receipt: workflowReceiptSchema.nullable(),
});
const executionPayloadSchema = z
    .object({
        userId: z.uuid(),
        actionRequestId: z.uuid(),
        jobId: z.uuid(),
        idempotencyKey: z.string(),
    })
    .passthrough();
const paths = {
    email_ingestion: '/webhook/webwidgets/email-ingestion',
    calendar_sync: '/webhook/webwidgets/calendar-sync',
    finance_sync: '/webhook/webwidgets/finance-sync',
    research_item_processing: '/webhook/webwidgets/research-item-processing',
    ml_enrichment: '/webhook/webwidgets/ml-enrichment',
    weekly_summary: '/webhook/webwidgets/weekly-summary',
    recovery_check_in_analysis:
        '/webhook/webwidgets/recovery-check-in-analysis',
} as const;
export async function executeApprovedWorkflow(
    db: SupabaseClient,
    input: z.infer<typeof workflowExecutionSchema>,
) {
    const loaded = await db
        .from('action_requests')
        .select('*')
        .eq('id', input.actionRequestId)
        .eq('user_id', input.userId)
        .single();
    if (loaded.error) throw new Error('workflow_action_forbidden');
    const request = workflowRequestSchema.parse(loaded.data);
    if ((await hashJson(request.payload)) !== request.payload_hash)
        throw new Error('workflow_payload_mismatch');
    const parameters = parseWorkflowParameters(
        request.payload.workflowKey,
        request.payload.parameters,
        input.userId,
    );
    const claimed = await db.rpc('claim_workflow_action', {
        p_request_id: request.id,
        p_job_id: input.jobId,
    });
    if (claimed.error) throw new Error('workflow_execution_blocked');
    const claim = claimSchema.parse(claimed.data);
    if (
        claim.receipt &&
        ['accepted', 'completed', 'failed'].includes(claim.state)
    )
        return claim.receipt;
    let outcome: z.infer<typeof workflowReceiptSchema>;
    if (!claim.dispatchAllowed)
        outcome = {
            state: 'unknown',
            providerObjectId: claim.providerObjectId,
            code: 'workflow_outcome_unknown',
        };
    else {
        const result = await triggerN8nWorkflow(
            {
                workflowKey: request.payload.workflowKey,
                webhookPath: paths[request.payload.workflowKey],
                payload: {
                    ...parameters,
                    actionRequestId: request.id,
                    jobId: input.jobId,
                    idempotencyKey: request.idempotency_key,
                },
                idempotencyKey: request.idempotency_key,
            },
            executionPayloadSchema,
        );
        outcome =
            result.ok && result.runId
                ? {
                      state: 'accepted',
                      providerObjectId: result.runId,
                      code: 'workflow_dispatch_verified',
                  }
                : {
                      state:
                          result.error?.code === 'N8N_TIMEOUT'
                              ? 'unknown'
                              : 'failed',
                      providerObjectId: null,
                      code:
                          result.error?.code === 'N8N_TIMEOUT'
                              ? 'workflow_outcome_unknown'
                              : 'workflow_dispatch_failed',
                  };
    }
    const recorded = await db.rpc('record_workflow_dispatch', {
        p_request_id: request.id,
        p_job_id: input.jobId,
        p_outcome: outcome,
    });
    if (recorded.error) throw new Error('workflow_outcome_persistence_failed');
    return workflowReceiptSchema.parse(recorded.data);
}
