import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { CandidateKind, CommitmentCandidateRecord } from './types';

export async function loadCommitmentCandidates(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const expired = await db.rpc('expire_candidate_actions');
    if (expired.error) throw new Error('candidate_expiry_failed');
    const candidates = await db
        .from('candidate_actions')
        .select(
            'id,candidate_kind,action_id,payload,payload_hash,payload_version,reason,confidence,state,extractor_version,model_version,expires_at,created_at',
        )
        .eq('user_id', userId)
        .in('state', [
            'proposed',
            'edited',
            'approved',
            'dismissed',
            'incorrect',
            'expired',
            'superseded',
        ])
        .order('created_at', { ascending: false })
        .limit(50);
    if (candidates.error) throw new Error('candidate_read_failed');
    const ids = (candidates.data ?? []).map((candidate) => candidate.id);
    if (!ids.length) return [];
    const evidence = await db
        .from('candidate_action_evidence')
        .select(
            'candidate_action_id,position,timeline_events(id,title,occurred_at,source_type)',
        )
        .eq('user_id', userId)
        .in('candidate_action_id', ids)
        .order('position');
    if (evidence.error) throw new Error('candidate_evidence_read_failed');
    const evidenceByCandidate = new Map<
        string,
        CommitmentCandidateRecord['evidence']
    >();
    for (const link of evidence.data ?? []) {
        const event = link.timeline_events;
        if (!event) continue;
        const values = evidenceByCandidate.get(link.candidate_action_id) ?? [];
        values.push({
            id: event.id,
            title: event.title,
            occurredAt: event.occurred_at,
            sourceType: event.source_type,
        });
        evidenceByCandidate.set(link.candidate_action_id, values);
    }
    return (candidates.data ?? []).map(
        (row): CommitmentCandidateRecord => ({
            id: row.id,
            kind: row.candidate_kind as CandidateKind,
            actionId: row.action_id,
            payload: row.payload,
            payloadHash: row.payload_hash,
            payloadVersion: row.payload_version,
            reason: row.reason,
            confidence: Number(row.confidence),
            state: row.state as CommitmentCandidateRecord['state'],
            extractorVersion: row.extractor_version,
            modelVersion: row.model_version,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            evidence: evidenceByCandidate.get(row.id) ?? [],
        }),
    );
}
