import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
    BriefingEvidence,
    BriefingFeedbackRating,
    BriefingPreferences,
    BriefingRecord,
    BriefingResponse,
    BriefingSection,
    BriefingStatus,
    BriefingTrigger,
} from './types';

const defaultPreferences: BriefingPreferences = {
    dailyEnabled: false,
    localTime: '08:00',
    timezone: 'UTC',
    windowHours: 24,
};

async function loadPreferences(db: SupabaseClient<Database>, userId: string) {
    const result = await db
        .from('briefing_preferences')
        .select('daily_enabled,local_time,timezone,window_hours')
        .eq('user_id', userId)
        .maybeSingle();
    if (result.error || !result.data) return defaultPreferences;
    return {
        dailyEnabled: result.data.daily_enabled,
        localTime: result.data.local_time.slice(0, 5),
        timezone: result.data.timezone,
        windowHours: result.data.window_hours,
    };
}

async function loadActiveJobId(db: SupabaseClient<Database>, userId: string) {
    const result = await db
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'briefing.generate')
        .in('status', ['queued', 'running', 'waiting'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return result.error ? null : (result.data?.id ?? null);
}

async function loadLatestRow(db: SupabaseClient<Database>, userId: string) {
    const result = await db
        .from('briefings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (result.error) throw new Error('briefing_read_failed');
    return result.data;
}

async function loadEvidence(
    db: SupabaseClient<Database>,
    userId: string,
    itemIds: string[],
) {
    if (!itemIds.length) return new Map<string, BriefingEvidence[]>();
    const links = await db
        .from('briefing_item_evidence')
        .select('briefing_item_id,timeline_event_id')
        .eq('user_id', userId)
        .in('briefing_item_id', itemIds);
    if (links.error) throw new Error('briefing_evidence_read_failed');
    const eventIds = [
        ...new Set((links.data ?? []).map((row) => row.timeline_event_id)),
    ];
    const events = eventIds.length
        ? await db
              .from('timeline_events')
              .select('id,title,occurred_at,source_type')
              .eq('user_id', userId)
              .in('id', eventIds)
        : { data: [], error: null };
    if (events.error) throw new Error('briefing_event_read_failed');
    const byEvent = new Map(
        (events.data ?? []).map((event) => [event.id, event]),
    );
    const byItem = new Map<string, BriefingEvidence[]>();
    for (const link of links.data ?? []) {
        const event = byEvent.get(link.timeline_event_id);
        if (!event) continue;
        byItem.set(link.briefing_item_id, [
            ...(byItem.get(link.briefing_item_id) ?? []),
            {
                eventId: event.id,
                title: event.title,
                occurredAt: event.occurred_at,
                sourceType: event.source_type,
            },
        ]);
    }
    return byItem;
}

export async function loadBriefingResponse(
    db: SupabaseClient<Database>,
    userId: string,
): Promise<BriefingResponse> {
    const [row, preferences, activeJobId] = await Promise.all([
        loadLatestRow(db, userId),
        loadPreferences(db, userId),
        loadActiveJobId(db, userId),
    ]);
    if (!row) return { briefing: null, preferences, activeJobId };
    const [items, feedback] = await Promise.all([
        db
            .from('briefing_items')
            .select('id,section,title,summary,confidence,position')
            .eq('user_id', userId)
            .eq('briefing_id', row.id)
            .order('position'),
        db
            .from('briefing_feedback')
            .select('briefing_item_id,rating')
            .eq('user_id', userId)
            .eq('briefing_id', row.id),
    ]);
    if (items.error || feedback.error)
        throw new Error('briefing_item_read_failed');
    const itemRows = items.data ?? [];
    const evidence = await loadEvidence(
        db,
        userId,
        itemRows.map((item) => item.id),
    );
    const feedbackByItem = new Map(
        (feedback.data ?? []).map((value) => [
            value.briefing_item_id,
            value.rating,
        ]),
    );
    const briefing: BriefingRecord = {
        id: row.id,
        status:
            ['ready', 'partial'].includes(row.status) &&
            Date.parse(row.expires_at) <= Date.now()
                ? 'stale'
                : (row.status as BriefingStatus),
        trigger: row.trigger_type as BriefingTrigger,
        coveredFrom: row.covered_from,
        coveredTo: row.covered_to,
        generatedAt: row.generated_at,
        expiresAt: row.expires_at,
        modelProvider: row.model_provider,
        modelName: row.model_name,
        modelVersion: row.model_version,
        ruleVersion: row.rule_version,
        warnings: row.warnings,
        inputEventCount: row.input_event_count,
        latencyMs: row.latency_ms,
        estimatedCostUsd: row.estimated_cost_usd,
        failureCode: row.failure_code,
        items: itemRows.map((item) => ({
            id: item.id,
            section: item.section as BriefingSection,
            title: item.title,
            summary: item.summary,
            confidence: item.confidence,
            evidence: evidence.get(item.id) ?? [],
            feedback:
                (feedbackByItem.get(item.id) as
                    | BriefingFeedbackRating
                    | undefined) ?? null,
        })),
    };
    return { briefing, preferences, activeJobId };
}
