import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    emailRequestSchema,
    emailReceiptSchema,
} from '@/lib/emailActions/receipts';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { executeGmailAction } from '@/lib/emailActions/gmailAdapter';
import { gmailTransport } from '@/lib/emailActions/gmailTransport';
import { loadGmailActionToken } from './gmailCredentials';
import { loadMicrosoftActionToken } from './microsoftCredentials';
import { executeOutlookAction } from '@/lib/emailActions/outlookAdapter';
import { outlookTransport } from '@/lib/emailActions/outlookTransport';

export const emailExecutionSchema = z.strictObject({
    userId: z.uuid(),
    actionRequestId: z.uuid(),
    jobId: z.uuid(),
});

const claimSchema = z.object({
    dispatchAllowed: z.boolean(),
    state: z.enum([
        'reserved',
        'prepared',
        'dispatching',
        'unknown',
        'failed',
        'verified',
    ]),
    providerObjectId: z.string().nullable(),
    receipt: emailReceiptSchema.nullable(),
});

export async function executeApprovedEmail(
    db: SupabaseClient,
    input: z.infer<typeof emailExecutionSchema>,
) {
    const result = await db
        .from('action_requests')
        .select('*')
        .eq('id', input.actionRequestId)
        .eq('user_id', input.userId)
        .single();
    if (result.error) throw new Error('email_action_forbidden');
    const request = emailRequestSchema.parse(result.data);
    if ((await hashJson(request.payload)) !== request.payload_hash)
        throw new Error('email_payload_mismatch');
    const token =
        request.payload.provider === 'google'
            ? await loadGmailActionToken(
                  db,
                  input.userId,
                  request.action_id,
                  request.payload,
              )
            : await loadMicrosoftActionToken(
                  db,
                  input.userId,
                  request.action_id,
                  request.payload,
              );
    const claimed = await db.rpc('claim_email_action', {
        p_request_id: request.id,
        p_job_id: input.jobId,
    });
    if (claimed.error) throw new Error('email_execution_blocked');
    const claim = claimSchema.parse(claimed.data);
    if (
        claim.receipt &&
        (claim.state === 'verified' || claim.state === 'failed')
    )
        return claim.receipt;
    const actionInput = {
        requestId: request.id,
        actionId: request.action_id,
        message: request.payload,
        dispatchAllowed: claim.dispatchAllowed,
        providerObjectId: claim.providerObjectId,
    };
    const checkpoint = async (
        state: 'prepared' | 'dispatching',
        providerObjectId: string,
    ) => {
        const saved = await db.rpc('checkpoint_email_action', {
            p_request_id: request.id,
            p_job_id: input.jobId,
            p_state: state,
            p_provider_object_id: providerObjectId,
        });
        if (saved.error) throw new Error('email_checkpoint_failed');
    };
    const outcome =
        request.payload.provider === 'google'
            ? await executeGmailAction(
                  gmailTransport(token),
                  actionInput,
                  checkpoint,
              )
            : await executeOutlookAction(
                  outlookTransport(token),
                  actionInput,
                  checkpoint,
              );
    const recorded = await db.rpc('record_email_action_outcome', {
        p_request_id: request.id,
        p_job_id: input.jobId,
        p_outcome: outcome,
    });
    if (recorded.error) throw new Error('email_outcome_persistence_failed');
    return emailReceiptSchema.parse(recorded.data);
}
