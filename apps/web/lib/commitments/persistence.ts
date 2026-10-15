import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createInsight } from '@/lib/lifecycle/derivedRepository';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { candidateFingerprint } from './extraction';
import type { ProposedCommitment } from './types';

export async function persistCommitmentCandidate(
    db: SupabaseClient<Database>,
    userId: string,
    candidate: ProposedCommitment,
) {
    const fingerprint = candidateFingerprint(candidate);
    const idempotencyKey = `commitment:${await hashJson(fingerprint)}`;
    const evidenceIds = [...new Set(candidate.evidenceIds)];
    const payloadHash = await hashJson(candidate.payload);
    const insight = await createInsight(db, {
        userId,
        evidenceTimelineEventIds: evidenceIds,
        idempotencyKey: `insight:${idempotencyKey}`,
        kind: 'commitment',
        title: String((candidate.payload as Record<string, unknown>).title),
        summary: candidate.reason,
        modelProvider: candidate.modelVersion ? 'anthropic' : 'deterministic',
        modelName: candidate.modelVersion ? 'commitment-candidates' : 'rules',
        modelVersion: candidate.modelVersion ?? candidate.extractorVersion,
        policyVersion: 'commitment-candidates-v1',
        confidence: candidate.confidence,
        expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        metadata: {},
    });
    const inserted = await db
        .from('candidate_actions')
        .upsert(
            {
                user_id: userId,
                insight_id: insight.id,
                idempotency_key: idempotencyKey,
                action_id:
                    candidate.kind === 'task'
                        ? 'tasks.create'
                        : 'calendar.create_event',
                candidate_kind: candidate.kind,
                payload: candidate.payload,
                payload_hash: payloadHash,
                payload_version: 1,
                policy_version: 'commitment-candidates-v1',
                confidence: candidate.confidence,
                reason: candidate.reason,
                extractor_version: candidate.extractorVersion,
                model_version: candidate.modelVersion,
                expires_at: new Date(
                    Date.now() + 30 * 86_400_000,
                ).toISOString(),
                metadata: { fingerprint },
            },
            { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true },
        )
        .select('id')
        .maybeSingle();
    let candidateId = inserted.data?.id;
    if (!candidateId) {
        const existing = await db
            .from('candidate_actions')
            .select('id')
            .eq('user_id', userId)
            .eq('idempotency_key', idempotencyKey)
            .single();
        if (existing.error) throw new Error('candidate_persist_failed');
        candidateId = existing.data.id;
    }
    const evidence = evidenceIds.map((timelineEventId, position) => ({
        user_id: userId,
        candidate_action_id: candidateId,
        timeline_event_id: timelineEventId,
        evidence_role: position === 0 ? 'primary' : 'supporting',
        position,
    }));
    const linked = await db.from('candidate_action_evidence').upsert(evidence, {
        onConflict: 'candidate_action_id,timeline_event_id',
        ignoreDuplicates: true,
    });
    if (linked.error) throw new Error('candidate_evidence_failed');
    return candidateId;
}
