import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type { BriefingSourceEvent } from './types';

interface BriefingInputs {
    events: BriefingSourceEvent[];
    seenFingerprints: Set<string>;
    contextFocus: string;
    warnings: string[];
    sourceCoverage: Json;
}

function metadataOf(value: Json): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

async function loadEvents(
    db: SupabaseClient<Database>,
    userId: string,
    coveredFrom: string,
    coveredTo: string,
) {
    const result = await db
        .from('timeline_events')
        .select(
            'id,event_type,source_type,title,summary,content_hash,occurred_at,updated_at,state,source_record_table,source_record_id,metadata',
        )
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('state', ['active', 'corrected', 'retracted'])
        .gte('occurred_at', coveredFrom)
        .lte('occurred_at', coveredTo)
        .order('occurred_at', { ascending: false })
        .limit(100);
    if (result.error) throw new Error('briefing_events_unavailable');
    return (result.data ?? []).map((row) => ({
        id: row.id,
        eventType: row.event_type,
        sourceType: row.source_type,
        title: row.title,
        summary: row.summary,
        contentHash: row.content_hash,
        occurredAt: row.occurred_at,
        updatedAt: row.updated_at,
        state: row.state,
        sourceRecordTable: row.source_record_table,
        sourceRecordId: row.source_record_id,
        metadata: metadataOf(row.metadata),
    }));
}

async function loadSeenFingerprints(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const result = await db
        .from('briefing_items')
        .select('fingerprint')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);
    if (result.error) return new Set<string>();
    return new Set((result.data ?? []).map((row) => row.fingerprint));
}

async function loadSourceCoverage(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const result = await db
        .from('integration_connections')
        .select(
            'provider_id,sync_status,last_sync_succeeded_at,sync_error_code',
        )
        .eq('user_id', userId)
        .is('disabled_at', null)
        .is('disconnected_at', null)
        .limit(100);
    if (result.error) {
        return {
            coverage: { unavailable: true } satisfies Json,
            warnings: ['Source health could not be verified.'],
        };
    }
    const sources = result.data ?? [];
    const impaired = sources.filter(
        (source) =>
            !['healthy', 'syncing', 'scheduled'].includes(source.sync_status) ||
            Boolean(source.sync_error_code),
    );
    return {
        coverage: {
            totalSources: sources.length,
            impairedSources: impaired.length,
            providers: [
                ...new Set(sources.map((source) => source.provider_id)),
            ],
        } satisfies Json,
        warnings: impaired.length
            ? [
                  `${impaired.length} source${impaired.length === 1 ? '' : 's'} may be stale or failing.`,
              ]
            : [],
    };
}

async function loadContextFocus(db: SupabaseClient<Database>, userId: string) {
    const consent = await db
        .from('consent_records')
        .select('id')
        .eq('user_id', userId)
        .eq('scope', 'timeline_analysis')
        .eq('state', 'granted')
        .maybeSingle();
    if (consent.error || !consent.data) return '';
    const [todos, goals, preferences] = await Promise.all([
        db
            .from('todos')
            .select('text,due_at')
            .eq('user_id', userId)
            .eq('completed', false)
            .order('due_at', { ascending: true, nullsFirst: false })
            .limit(30),
        db
            .from('tracking_goals')
            .select('category,target_type,target_value')
            .eq('user_id', userId)
            .eq('active', true)
            .limit(20),
        db
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', userId)
            .maybeSingle(),
    ]);
    const due = (todos.data ?? []).map((todo) =>
        todo.due_at ? `${todo.text} due ${todo.due_at}` : todo.text,
    );
    const activeGoals = (goals.data ?? []).map(
        (goal) =>
            `${goal.category}: ${goal.target_type} ${String(goal.target_value)}`,
    );
    const preferenceKeys = Object.keys(
        metadataOf(preferences.data?.preferences ?? {}),
    ).slice(0, 12);
    return [
        due.length ? `Active tasks: ${due.join('; ')}` : '',
        activeGoals.length ? `Active goals: ${activeGoals.join('; ')}` : '',
        preferenceKeys.length
            ? `Preference areas: ${preferenceKeys.join(', ')}`
            : '',
    ]
        .filter(Boolean)
        .join('\n')
        .slice(0, 2_000);
}

export async function loadBriefingInputs(
    db: SupabaseClient<Database>,
    userId: string,
    coveredFrom: string,
    coveredTo: string,
): Promise<BriefingInputs> {
    const [events, seenFingerprints, sources, contextFocus] = await Promise.all(
        [
            loadEvents(db, userId, coveredFrom, coveredTo),
            loadSeenFingerprints(db, userId),
            loadSourceCoverage(db, userId),
            loadContextFocus(db, userId),
        ],
    );
    return {
        events,
        seenFingerprints,
        contextFocus,
        warnings: sources.warnings,
        sourceCoverage: sources.coverage,
    };
}
