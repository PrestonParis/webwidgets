import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import {
    actionRequestInputSchema,
    actionResultInputSchema,
    approvalDecisionInputSchema,
} from './actionSchemas';
import { mapActionRequest, mapActionResult } from './executionMappers';
import type { ActionRequestRecord, ActionResultRecord } from './executionTypes';
import { hashJson } from './idempotency';
import { assertMatchingHash, insertOrReadByKey } from './repositoryUtils';
import type {
    ActionRequestInput,
    ActionResultInput,
    ApprovalDecisionInput,
} from './types';

function inDays(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString();
}

function asRpcRow(value: unknown): Record<string, unknown> | null {
    const candidate = Array.isArray(value) ? (value as unknown[])[0] : value;
    if (!candidate || typeof candidate !== 'object') return null;
    return candidate as Record<string, unknown>;
}

export async function createActionRequest(
    db: SupabaseClient,
    input: ActionRequestInput,
): Promise<ActionRequestRecord> {
    const parsed = actionRequestInputSchema.parse(input);
    const payloadHash = parsed.payloadHash ?? (await hashJson(parsed.payload));
    const persisted = await insertOrReadByKey(
        db,
        'action_requests',
        {
            user_id: parsed.userId,
            candidate_action_id: parsed.candidateActionId,
            ...(parsed.automationRunId && {
                automation_run_id: parsed.automationRunId,
            }),
            ...(parsed.jobId && { job_id: parsed.jobId }),
            idempotency_key: parsed.idempotencyKey,
            action_id: parsed.actionId,
            ...(parsed.sourceWidgetId && {
                source_widget_id: parsed.sourceWidgetId,
            }),
            payload: parsed.payload,
            payload_hash: payloadHash,
            payload_version: parsed.payloadVersion,
            approval_state: 'required',
            status: 'pending',
            policy_version: parsed.policyVersion,
            permission_snapshot_hash: parsed.permissionSnapshotHash,
            confidence: parsed.confidence ?? null,
            requested_at: new Date().toISOString(),
            expires_at: parsed.expiresAt ?? inDays(365),
        },
        parsed.userId,
        parsed.idempotencyKey,
    );
    assertMatchingHash(
        persisted.row,
        'payload_hash',
        payloadHash,
        'Action request',
    );
    return mapActionRequest(persisted.row);
}

export async function decideActionRequest(
    db: SupabaseClient,
    input: ApprovalDecisionInput,
): Promise<ActionRequestRecord> {
    const parsed = approvalDecisionInputSchema.parse(input);
    const result = await db.rpc('decide_action_request', {
        p_action_request_id: parsed.actionRequestId,
        p_decision: parsed.decision,
        p_payload: parsed.payload ?? null,
        p_payload_hash: parsed.payloadHash ?? null,
        p_payload_version: parsed.payloadVersion ?? null,
        p_permission_snapshot_hash: parsed.permissionSnapshotHash,
        p_decided_at: parsed.decidedAt ?? new Date().toISOString(),
    });
    if (result.error) throw result.error;
    const data = asRpcRow(result.data as unknown);
    if (!data)
        throw new Error('Approval transition returned no action request');
    const request = mapActionRequest(data);
    if (request.userId !== parsed.userId) {
        throw new Error('Approval transition returned the wrong owner');
    }
    return request;
}

export async function markActionRequestRunning(
    db: SupabaseClient,
    userId: string,
    actionRequestId: string,
): Promise<ActionRequestRecord> {
    const result = await db
        .from('action_requests')
        .update({
            status: 'running',
            execution_started_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('id', actionRequestId)
        .eq('approval_state', 'approved')
        .in('status', ['pending', 'queued', 'deferred'])
        .select('*')
        .single();
    if (result.error) throw result.error;
    return mapActionRequest(result.data as Record<string, unknown>);
}

export async function recordActionResult(
    db: SupabaseClient,
    input: ActionResultInput,
): Promise<ActionResultRecord> {
    const parsed = actionResultInputSchema.parse(input);
    const hashContent: Json = {
        status: parsed.status,
        output: parsed.output ?? null,
        message: parsed.message,
        providerId: parsed.providerId ?? null,
        providerExecutionId: parsed.providerExecutionId ?? null,
        verificationStatus: parsed.verificationStatus ?? null,
    };
    const resultHash = parsed.resultHash ?? (await hashJson(hashContent));
    const persisted = await insertOrReadByKey(
        db,
        'action_results',
        {
            user_id: parsed.userId,
            action_request_id: parsed.actionRequestId,
            ...(parsed.jobId && { job_id: parsed.jobId }),
            idempotency_key: parsed.idempotencyKey,
            attempt: parsed.attempt,
            status: parsed.status,
            provider_id: parsed.providerId ?? null,
            provider_execution_id: parsed.providerExecutionId ?? null,
            output: parsed.output ?? null,
            result_hash: resultHash,
            ok: parsed.status === 'succeeded',
            message: parsed.message,
            failure_code: parsed.failureCode ?? null,
            failure_detail: parsed.failureDetail ?? null,
            verification_status: parsed.verificationStatus ?? null,
            verified_at: parsed.verifiedAt ?? null,
            undo_status: parsed.undoStatus ?? null,
            rollback_token: parsed.rollbackToken ?? null,
            compensation_metadata: parsed.compensationMetadata,
            metadata: parsed.metadata,
            started_at: parsed.startedAt ?? null,
            completed_at: parsed.completedAt ?? null,
            expires_at: parsed.expiresAt ?? inDays(365),
        },
        parsed.userId,
        parsed.idempotencyKey,
    );
    assertMatchingHash(
        persisted.row,
        'result_hash',
        resultHash,
        'Action result',
    );
    await updateRequestFromResult(db, parsed);
    return mapActionResult(persisted.row);
}

async function updateRequestFromResult(
    db: SupabaseClient,
    result: ActionResultInput,
): Promise<void> {
    const request = await db
        .from('action_requests')
        .select('id,candidate_action_id')
        .eq('user_id', result.userId)
        .eq('id', result.actionRequestId)
        .single();
    if (request.error) throw request.error;
    const verified =
        result.status === 'succeeded' &&
        result.verificationStatus === 'verified';
    const terminal =
        verified || ['failed', 'cancelled'].includes(result.status);
    const status = verified
        ? 'completed'
        : result.status === 'failed' || result.status === 'cancelled'
          ? result.status
          : 'running';
    const updated = await db
        .from('action_requests')
        .update({
            status,
            ...(terminal && {
                execution_completed_at:
                    result.completedAt ?? new Date().toISOString(),
            }),
            failure_code: result.failureCode ?? null,
            failure_detail: result.failureDetail ?? null,
        })
        .eq('user_id', result.userId)
        .eq('id', result.actionRequestId);
    if (updated.error) throw updated.error;
    if (request.data.candidate_action_id && terminal) {
        const candidate = await db
            .from('candidate_actions')
            .update({ state: verified ? 'completed' : 'failed' })
            .eq('user_id', result.userId)
            .eq('id', request.data.candidate_action_id);
        if (candidate.error) throw candidate.error;
    }
}
