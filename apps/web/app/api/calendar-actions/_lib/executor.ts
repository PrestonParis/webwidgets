import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calendarRequestSchema } from '@/lib/calendarActions/receipts';
import { calendarReceiptSchema } from '@/lib/calendarActions/contracts';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { executeCalendarCreate } from '@/lib/calendarActions/googleCalendarAdapter';
import { googleCalendarTransport } from '@/lib/calendarActions/googleCalendarTransport';
import { loadCalendarActionToken } from './googleCredentials';
export const calendarExecutionSchema = z.strictObject({
    userId: z.uuid(),
    actionRequestId: z.uuid(),
    jobId: z.uuid(),
});
const claimSchema = z.object({
    dispatchAllowed: z.boolean(),
    state: z.string(),
    providerObjectId: z.string().nullable(),
    receipt: calendarReceiptSchema.nullable(),
});
export async function executeApprovedCalendar(
    db: SupabaseClient,
    input: z.infer<typeof calendarExecutionSchema>,
) {
    const loaded = await db
        .from('action_requests')
        .select('*')
        .eq('id', input.actionRequestId)
        .eq('user_id', input.userId)
        .single();
    if (loaded.error) throw new Error('calendar_action_forbidden');
    const request = calendarRequestSchema.parse(loaded.data);
    if ((await hashJson(request.payload)) !== request.payload_hash)
        throw new Error('calendar_payload_mismatch');
    const token = await loadCalendarActionToken(
        db,
        input.userId,
        request.payload,
    );
    const claimed = await db.rpc('claim_calendar_action', {
        p_request_id: request.id,
        p_job_id: input.jobId,
    });
    if (claimed.error) throw new Error('calendar_execution_blocked');
    const claim = claimSchema.parse(claimed.data);
    if (
        claim.receipt &&
        (claim.state === 'verified' || claim.state === 'failed')
    )
        return claim.receipt;
    const outcome = await executeCalendarCreate(
        googleCalendarTransport(token),
        {
            requestId: request.id,
            event: request.payload,
            dispatchAllowed: claim.dispatchAllowed,
        },
    );
    const recorded = await db.rpc('record_calendar_action_outcome', {
        p_request_id: request.id,
        p_job_id: input.jobId,
        p_outcome: outcome,
    });
    if (recorded.error) throw new Error('calendar_outcome_persistence_failed');
    return calendarReceiptSchema.parse(recorded.data);
}
