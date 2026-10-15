import type { Json } from '@/types/supabase';
import type { ActionRequestRecord, ActionResultRecord } from './executionTypes';

type Row = Record<string, unknown>;

function nullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

export function mapActionRequest(row: Row): ActionRequestRecord {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        candidateActionId: String(row.candidate_action_id),
        automationRunId: nullableString(row.automation_run_id),
        jobId: nullableString(row.job_id),
        idempotencyKey: String(row.idempotency_key),
        actionId: String(row.action_id),
        payload: row.payload as Json,
        payloadHash: String(row.payload_hash),
        payloadVersion: Number(row.payload_version),
        approvalState:
            row.approval_state as ActionRequestRecord['approvalState'],
        status: String(row.status),
        policyVersion: String(row.policy_version),
        permissionSnapshotHash: String(row.permission_snapshot_hash),
        approvedPayload: (row.approved_payload as Json | null) ?? null,
        approvedPayloadHash: nullableString(row.approved_payload_hash),
        approvedPayloadVersion:
            row.approved_payload_version === null ||
            row.approved_payload_version === undefined
                ? null
                : Number(row.approved_payload_version),
        requestedAt: String(row.requested_at),
        decidedAt: nullableString(row.decided_at),
        expiresAt: String(row.expires_at),
        stateVersion: Number(row.state_version),
    };
}

export function mapActionResult(row: Row): ActionResultRecord {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        actionRequestId: String(row.action_request_id),
        jobId: nullableString(row.job_id),
        idempotencyKey: String(row.idempotency_key),
        attempt: Number(row.attempt),
        status: row.status as ActionResultRecord['status'],
        providerId: nullableString(row.provider_id),
        providerExecutionId: nullableString(row.provider_execution_id),
        output: (row.output as Json | null) ?? null,
        resultHash: String(row.result_hash),
        message: String(row.message),
        verificationStatus: nullableString(row.verification_status),
        verifiedAt: nullableString(row.verified_at),
        undoStatus: nullableString(row.undo_status),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    };
}
