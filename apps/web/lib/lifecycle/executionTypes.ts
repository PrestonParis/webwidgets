import type { Json } from '@/types/supabase';
import type {
    CandidateAction,
    CanonicalTimelineEvent,
    Insight,
    RawObservation,
} from './types';

export interface ActionRequestRecord {
    id: string;
    userId: string;
    candidateActionId: string;
    automationRunId: string | null;
    jobId: string | null;
    idempotencyKey: string;
    actionId: string;
    payload: Json;
    payloadHash: string;
    payloadVersion: number;
    approvalState: 'not_required' | 'required' | 'approved' | 'denied';
    status: string;
    policyVersion: string;
    permissionSnapshotHash: string;
    approvedPayload: Json | null;
    approvedPayloadHash: string | null;
    approvedPayloadVersion: number | null;
    requestedAt: string;
    decidedAt: string | null;
    expiresAt: string;
    stateVersion: number;
}

export interface ActionResultRecord {
    id: string;
    userId: string;
    actionRequestId: string;
    jobId: string | null;
    idempotencyKey: string;
    attempt: number;
    status: 'started' | 'succeeded' | 'failed' | 'cancelled' | 'unknown';
    providerId: string | null;
    providerExecutionId: string | null;
    output: Json | null;
    resultHash: string;
    message: string;
    verificationStatus: string | null;
    verifiedAt: string | null;
    undoStatus: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LifecycleTrace {
    observations: RawObservation[];
    timelineEvents: CanonicalTimelineEvent[];
    insight: Insight;
    candidateAction: CandidateAction;
    actionRequest: ActionRequestRecord;
    actionResults: ActionResultRecord[];
    job: Record<string, unknown> | null;
    automationRun: Record<string, unknown> | null;
}
