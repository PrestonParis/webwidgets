import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import { candidateActionInputSchema, insightInputSchema } from './coreSchemas';
import { hashJson } from './idempotency';
import { mapCandidateAction, mapInsight } from './mappers';
import { assertMatchingHash, insertOrReadByKey } from './repositoryUtils';
import type {
    CandidateAction,
    CandidateActionInput,
    Insight,
    InsightInput,
} from './types';

export async function createInsight(
    db: SupabaseClient,
    input: InsightInput,
): Promise<Insight> {
    const parsed = insightInputSchema.parse(input);
    const evidenceIds = [...new Set(parsed.evidenceTimelineEventIds)];
    const content: Json = {
        evidenceIds,
        kind: parsed.kind,
        title: parsed.title,
        summary: parsed.summary,
        modelProvider: parsed.modelProvider,
        modelName: parsed.modelName,
        modelVersion: parsed.modelVersion,
        policyVersion: parsed.policyVersion,
    };
    const contentHash = parsed.contentHash ?? (await hashJson(content));
    const persisted = await insertOrReadByKey(
        db,
        'insights',
        {
            user_id: parsed.userId,
            primary_timeline_event_id: evidenceIds[0],
            idempotency_key: parsed.idempotencyKey,
            kind: parsed.kind,
            title: parsed.title,
            summary: parsed.summary,
            content_hash: contentHash,
            model_provider: parsed.modelProvider,
            model_name: parsed.modelName,
            model_version: parsed.modelVersion,
            policy_version: parsed.policyVersion,
            confidence: parsed.confidence,
            expires_at: parsed.expiresAt,
            metadata: parsed.metadata,
        },
        parsed.userId,
        parsed.idempotencyKey,
    );
    assertMatchingHash(persisted.row, 'content_hash', contentHash, 'Insight');
    const evidence = evidenceIds.map((timelineEventId, position) => ({
        user_id: parsed.userId,
        insight_id: persisted.row.id,
        timeline_event_id: timelineEventId,
        evidence_role: position === 0 ? 'primary' : 'supporting',
        position,
    }));
    const linked = await db.from('insight_timeline_events').upsert(evidence, {
        onConflict: 'insight_id,timeline_event_id',
        ignoreDuplicates: true,
    });
    if (linked.error) throw linked.error;
    return mapInsight(persisted.row, evidenceIds);
}

export async function createCandidateAction(
    db: SupabaseClient,
    input: CandidateActionInput,
): Promise<CandidateAction> {
    const parsed = candidateActionInputSchema.parse(input);
    const payloadHash = parsed.payloadHash ?? (await hashJson(parsed.payload));
    const persisted = await insertOrReadByKey(
        db,
        'candidate_actions',
        {
            user_id: parsed.userId,
            insight_id: parsed.insightId,
            idempotency_key: parsed.idempotencyKey,
            action_id: parsed.actionId,
            payload: parsed.payload,
            payload_hash: payloadHash,
            payload_version: parsed.payloadVersion,
            policy_version: parsed.policyVersion,
            confidence: parsed.confidence,
            expires_at: parsed.expiresAt,
            metadata: parsed.metadata,
        },
        parsed.userId,
        parsed.idempotencyKey,
    );
    assertMatchingHash(
        persisted.row,
        'payload_hash',
        payloadHash,
        'Candidate action',
    );
    return mapCandidateAction(persisted.row);
}
