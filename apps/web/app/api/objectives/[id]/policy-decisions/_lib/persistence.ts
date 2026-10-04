import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    approvalSchema,
    policyDecisionSchema,
} from '@/lib/automationContracts/governance';
import {
    persistenceAuthoritySchema,
    persistenceResultSchema,
    PolicyPersistenceError,
} from './schemas';

const decisionRowSchema = z.object({
    id: z.string().uuid(),
    objective_id: z.string().uuid(),
    plan_id: z.string().uuid().nullable(),
    step_id: z.string().uuid().nullable(),
    budget_id: z.string().uuid(),
    user_id: z.string().uuid(),
    capability_name: z.string().nullable(),
    capability_version: z.string().nullable(),
    risk_class: z.string(),
    normalized_payload: z.record(z.string(), z.unknown()),
    payload_hash: z.string(),
    policy_version: z.string(),
    consent_snapshot_hash: z.string(),
    connection_snapshot_hash: z.string(),
    budget_snapshot_hash: z.string(),
    delegation_snapshot_hash: z.string(),
    allowlist_snapshot_hash: z.string(),
    decision: z.string(),
    reason_codes: z.array(z.string()),
    requires_approval: z.boolean(),
    evaluated_at: z.string(),
    expires_at: z.string(),
});
const approvalRowSchema = z.object({
    id: z.string().uuid(),
    objective_id: z.string().uuid(),
    plan_id: z.string().uuid(),
    step_id: z.string().uuid(),
    policy_decision_id: z.string().uuid(),
    user_id: z.string().uuid(),
    payload: z.record(z.string(), z.unknown()),
    payload_hash: z.string(),
    payload_version: z.number(),
    status: z.string(),
    decided_by: z.string().uuid().nullable(),
    decided_payload: z.record(z.string(), z.unknown()).nullable(),
    decided_payload_hash: z.string().nullable(),
    decided_payload_version: z.number().nullable(),
    requested_at: z.string(),
    decided_at: z.string().nullable(),
    expires_at: z.string(),
});

function decisionContract(input: unknown) {
    const row = decisionRowSchema.parse(input);
    return policyDecisionSchema.parse({
        contractVersion: '2.0',
        id: row.id,
        objectiveId: row.objective_id,
        planId: row.plan_id,
        stepId: row.step_id,
        budgetId: row.budget_id,
        userId: row.user_id,
        capabilityName: row.capability_name,
        capabilityVersion: row.capability_version,
        riskClass: row.risk_class,
        normalizedPayload: row.normalized_payload,
        payloadHash: row.payload_hash,
        policyVersion: row.policy_version,
        consentSnapshotHash: row.consent_snapshot_hash,
        connectionSnapshotHash: row.connection_snapshot_hash,
        budgetSnapshotHash: row.budget_snapshot_hash,
        delegationSnapshotHash: row.delegation_snapshot_hash,
        allowlistSnapshotHash: row.allowlist_snapshot_hash,
        decision: row.decision,
        reasonCodes: row.reason_codes,
        requiresApproval: row.requires_approval,
        evaluatedAt: row.evaluated_at,
        expiresAt: row.expires_at,
    });
}

function approvalContract(input: unknown) {
    const row = approvalRowSchema.parse(input);
    return approvalSchema.parse({
        contractVersion: '2.0',
        id: row.id,
        objectiveId: row.objective_id,
        planId: row.plan_id,
        stepId: row.step_id,
        policyDecisionId: row.policy_decision_id,
        userId: row.user_id,
        payload: row.payload,
        payloadHash: row.payload_hash,
        payloadVersion: row.payload_version,
        status: row.status,
        decidedBy: row.decided_by,
        decidedPayload: row.decided_payload,
        decidedPayloadHash: row.decided_payload_hash,
        decidedPayloadVersion: row.decided_payload_version,
        requestedAt: row.requested_at,
        decidedAt: row.decided_at,
        expiresAt: row.expires_at,
    });
}

export async function persistPolicyDecision(
    db: SupabaseClient,
    decision: unknown,
    authority: unknown,
) {
    const contract = policyDecisionSchema.parse(decision);
    const canonicalAuthority = persistenceAuthoritySchema.parse(authority);
    const persisted = await db.rpc('persist_v2_policy_decision', {
        p_decision: contract,
        p_authority: canonicalAuthority,
    });
    if (persisted.error)
        throw new PolicyPersistenceError('policy_persistence_failed', 409);
    const ids = persistenceResultSchema.parse(persisted.data);
    const [decisionResult, approvalResult] = await Promise.all([
        db
            .from('objective_policy_decisions')
            .select('*')
            .eq('id', ids.decisionId)
            .single(),
        ids.approvalId
            ? db
                  .from('objective_approvals')
                  .select('*')
                  .eq('id', ids.approvalId)
                  .single()
            : Promise.resolve({ data: null, error: null }),
    ]);
    if (decisionResult.error || approvalResult.error || !decisionResult.data) {
        throw new PolicyPersistenceError('policy_persistence_read_failed', 500);
    }
    return {
        policyDecision: decisionContract(decisionResult.data),
        approval: approvalResult.data
            ? approvalContract(approvalResult.data)
            : null,
        reused: ids.reused,
    };
}
