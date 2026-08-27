import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { hashJson } from '@/lib/lifecycle/idempotency';
import {
    calendarCandidatePayloadSchema,
    candidateReviewSchema,
    taskCandidatePayloadSchema,
} from './schemas';

export async function reviewCommitmentCandidate(
    db: SupabaseClient<Database>,
    candidateId: string,
    input: unknown,
) {
    const parsed = candidateReviewSchema.parse(input);
    if (parsed.decision === 'edit') {
        const schema =
            parsed.kind === 'task'
                ? taskCandidatePayloadSchema
                : calendarCandidatePayloadSchema;
        const payload = schema.parse(parsed.payload);
        const result = await db.rpc('edit_candidate_action', {
            p_candidate_id: candidateId,
            p_expected_version: parsed.expectedVersion,
            p_payload: payload,
            p_payload_hash: await hashJson(payload),
        });
        if (result.error) throw new Error('candidate_edit_conflict');
        return { state: 'edited' as const };
    }
    const decision =
        parsed.decision === 'approve' ? 'approved' : parsed.decision;
    const result = await db.rpc('review_candidate_action', {
        p_candidate_id: candidateId,
        p_expected_version: parsed.expectedVersion,
        p_expected_hash: parsed.expectedHash,
        p_decision: decision,
    });
    if (result.error) throw new Error('candidate_review_conflict');
    return { state: decision };
}
