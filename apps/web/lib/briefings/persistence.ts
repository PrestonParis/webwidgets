import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type {
    BriefingSection,
    BriefingSynthesisItem,
    RankedBriefingEvent,
} from './types';

export interface PersistedBriefingItem extends BriefingSynthesisItem {
    section: BriefingSection;
    relevance: number;
    novelty: number;
    urgency: number;
    importance: number;
    fingerprint: string;
}

export interface BriefingCompletion {
    status: 'ready' | 'partial' | 'empty' | 'stale' | 'failed';
    items: PersistedBriefingItem[];
    warnings: string[];
    sourceCoverage: Json;
    inputEventCount: number;
    provider: string;
    model: string;
    modelVersion: string;
    latencyMs: number;
    estimatedCostUsd: number | null;
    failureCode?: string;
    failureDetail?: string;
}

export async function createBriefingRecord(
    db: SupabaseClient<Database>,
    input: {
        userId: string;
        jobId: string;
        idempotencyKey: string;
        trigger: 'daily' | 'on_demand';
        coveredFrom: string;
        coveredTo: string;
        ruleVersion: string;
    },
) {
    const expiresAt = new Date(
        Date.parse(input.coveredTo) + 48 * 3_600_000,
    ).toISOString();
    const inserted = await db
        .from('briefings')
        .upsert(
            {
                user_id: input.userId,
                job_id: input.jobId,
                idempotency_key: input.idempotencyKey,
                trigger_type: input.trigger,
                status: 'generating',
                covered_from: input.coveredFrom,
                covered_to: input.coveredTo,
                expires_at: expiresAt,
                rule_version: input.ruleVersion,
            },
            { onConflict: 'user_id,idempotency_key' },
        )
        .select('id')
        .single();
    if (inserted.error) throw new Error('briefing_create_failed');
    return inserted.data.id;
}

async function replaceItems(
    db: SupabaseClient<Database>,
    userId: string,
    briefingId: string,
    items: PersistedBriefingItem[],
) {
    const removed = await db
        .from('briefing_items')
        .delete()
        .eq('user_id', userId)
        .eq('briefing_id', briefingId);
    if (removed.error) throw new Error('briefing_item_reset_failed');
    if (!items.length) return;
    const inserted = await db
        .from('briefing_items')
        .insert(
            items.map((item, position) => ({
                user_id: userId,
                briefing_id: briefingId,
                section: item.section,
                title: item.title,
                summary: item.summary,
                position,
                relevance_score: item.relevance,
                novelty_score: item.novelty,
                urgency_score: item.urgency,
                importance_score: item.importance,
                confidence: item.confidence,
                fingerprint: item.fingerprint,
            })),
        )
        .select('id,position');
    if (inserted.error) throw new Error('briefing_item_insert_failed');
    const evidence = (inserted.data ?? []).flatMap(
        (row) =>
            items[row.position]?.evidenceIds.map((timelineEventId) => ({
                user_id: userId,
                briefing_item_id: row.id,
                timeline_event_id: timelineEventId,
                evidence_role: 'supporting',
            })) ?? [],
    );
    if (!evidence.length) return;
    const linked = await db.from('briefing_item_evidence').insert(evidence);
    if (linked.error) throw new Error('briefing_evidence_insert_failed');
}

export async function completeBriefing(
    db: SupabaseClient<Database>,
    userId: string,
    briefingId: string,
    completion: BriefingCompletion,
) {
    await replaceItems(db, userId, briefingId, completion.items);
    const result = await db
        .from('briefings')
        .update({
            status: completion.status,
            generated_at: new Date().toISOString(),
            model_provider: completion.provider,
            model_name: completion.model,
            model_version: completion.modelVersion,
            warnings: completion.warnings,
            source_coverage: completion.sourceCoverage,
            input_event_count: completion.inputEventCount,
            surfaced_item_count: completion.items.length,
            latency_ms: completion.latencyMs,
            estimated_cost_usd: completion.estimatedCostUsd,
            failure_code: completion.failureCode ?? null,
            failure_detail: completion.failureDetail ?? null,
        })
        .eq('id', briefingId)
        .eq('user_id', userId);
    if (result.error) throw new Error('briefing_completion_failed');
}

export function scoresForEvidence(
    evidenceIds: string[],
    rankedById: Map<string, RankedBriefingEvent>,
) {
    const evidence = evidenceIds
        .map((id) => rankedById.get(id))
        .filter((value): value is RankedBriefingEvent => Boolean(value));
    const primary = evidence[0];
    const average = (key: 'relevance' | 'novelty' | 'urgency' | 'importance') =>
        evidence.reduce((total, event) => total + event[key], 0) /
        Math.max(1, evidence.length);
    return {
        section: primary?.section ?? ('review' as const),
        relevance: average('relevance'),
        novelty: average('novelty'),
        urgency: average('urgency'),
        importance: average('importance'),
        fingerprint: primary?.contentHash ?? evidenceIds.join(':'),
    };
}
