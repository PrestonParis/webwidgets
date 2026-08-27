import type { Json } from '@/types/supabase';

export type CandidateKind = 'task' | 'calendar';

export interface CommitmentSourceEvent {
    id: string;
    eventType: string;
    sourceType: string;
    title: string;
    summary: string | null;
    occurredAt: string;
    contentHash: string;
    metadata: Record<string, unknown>;
}

export interface ProposedCommitment {
    kind: CandidateKind;
    payload: Json;
    reason: string;
    evidenceIds: string[];
    confidence: number;
    extractorVersion: string;
    modelVersion: string | null;
}

export interface CommitmentCandidateRecord {
    id: string;
    kind: CandidateKind;
    actionId: string;
    payload: Json;
    payloadHash: string;
    payloadVersion: number;
    reason: string;
    confidence: number;
    state:
        | 'proposed'
        | 'edited'
        | 'approved'
        | 'dismissed'
        | 'incorrect'
        | 'expired'
        | 'superseded';
    extractorVersion: string;
    modelVersion: string | null;
    expiresAt: string;
    createdAt: string;
    evidence: Array<{
        id: string;
        title: string;
        occurredAt: string;
        sourceType: string;
    }>;
}
