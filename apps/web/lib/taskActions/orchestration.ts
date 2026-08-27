import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { enqueueTaskAction } from './workerClient';

interface ActionRequestRow {
    id: string;
    idempotency_key: string;
}

export async function materializeAndEnqueueTaskAction(input: {
    db: SupabaseClient<Database>;
    userId: string;
    candidateId: string;
    expectedVersion: number;
    expectedHash: string;
}) {
    const materialized = await input.db.rpc(
        'materialize_approved_task_action',
        {
            p_candidate_id: input.candidateId,
            p_expected_version: input.expectedVersion,
            p_expected_hash: input.expectedHash,
        },
    );
    if (materialized.error || !materialized.data) {
        throw new Error('task_materialization_conflict');
    }
    const request = materialized.data as ActionRequestRow;
    try {
        const receipt = await enqueueTaskAction({
            userId: input.userId,
            actionRequestId: request.id,
            idempotencyKey: `execute:${request.id}`,
        });
        return {
            actionRequestId: request.id,
            jobId: receipt.jobId,
            queued: true,
        };
    } catch {
        return { actionRequestId: request.id, jobId: null, queued: false };
    }
}

export async function retryTaskAction(input: {
    db: SupabaseClient<Database>;
    userId: string;
    actionRequestId: string;
}) {
    const result = await input.db
        .from('action_requests')
        .select('id,idempotency_key,approval_state,status')
        .eq('id', input.actionRequestId)
        .eq('user_id', input.userId)
        .single();
    if (result.error || result.data.approval_state !== 'approved') {
        throw new Error('task_retry_forbidden');
    }
    if (result.data.status === 'completed') {
        return { actionRequestId: result.data.id, completed: true };
    }
    const receipt = await enqueueTaskAction({
        userId: input.userId,
        actionRequestId: result.data.id,
        idempotencyKey: `execute:${result.data.id}`,
    });
    return {
        actionRequestId: result.data.id,
        jobId: receipt.jobId,
        completed: false,
    };
}
