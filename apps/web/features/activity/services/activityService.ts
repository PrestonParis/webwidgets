import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ActivityEvent,
    ActivityEventInput,
    ActivityQueryOptions,
} from '@/features/activity/types/activity';
import { bridgeUrgentActivityToNotification } from './activityNotifications';
import { mapActivityRow, type ActivityEventRow } from './activityRows';

// ── Publishing ────────────────────────────────────────────────────────────────

export async function publishActivityEvent(
    supabase: SupabaseClient,
    input: ActivityEventInput,
): Promise<ActivityEvent> {
    const result = await supabase
        .from('activity_events')
        .insert({
            user_id: input.userId,
            source: input.source,
            event_type: input.eventType ?? null,
            source_id: input.sourceId ?? null,
            source_table: input.sourceTable ?? null,
            severity: input.severity ?? 'info',
            priority: input.priority ?? 'normal',
            category: input.category ?? 'system',
            title: input.title,
            body: input.body ?? null,
            occurred_at: input.occurredAt ?? new Date().toISOString(),
            related_entities: input.relatedEntities ?? [],
            metadata: input.metadata ?? {},
            action_url: input.actionUrl ?? null,
            origin: input.origin ?? 'domain',
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return mapActivityRow(result.data as ActivityEventRow);
}

// Fire-and-forget variant — never throws. Use where activity publishing is
// supplementary and must not break the primary operation.
// Also bridges critical/high-priority events into the notifications table
// so they surface in the existing notification system.
export async function publishActivityEventSafe(
    supabase: SupabaseClient,
    input: ActivityEventInput,
): Promise<void> {
    try {
        const event = await publishActivityEvent(supabase, input);
        bridgeUrgentActivityToNotification(supabase, input);
        void event;
    } catch {
        console.error('[activityService] Failed to publish event', {
            source: input.source,
            eventType: input.eventType,
            userId: input.userId,
        });
    }
}

export async function bulkPublishActivityEvents(
    supabase: SupabaseClient,
    inputs: ActivityEventInput[],
): Promise<void> {
    if (inputs.length === 0) return;
    const rows = inputs.map((input) => ({
        user_id: input.userId,
        source: input.source,
        event_type: input.eventType ?? null,
        source_id: input.sourceId ?? null,
        source_table: input.sourceTable ?? null,
        severity: input.severity ?? 'info',
        priority: input.priority ?? 'normal',
        category: input.category ?? 'system',
        title: input.title,
        body: input.body ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        related_entities: input.relatedEntities ?? [],
        metadata: input.metadata ?? {},
        action_url: input.actionUrl ?? null,
        origin: input.origin ?? 'domain',
    }));
    const { error } = await supabase.from('activity_events').insert(rows);
    if (error) throw error;
}

// ── Querying ──────────────────────────────────────────────────────────────────

export async function listActivityEvents(
    supabase: SupabaseClient,
    userId: string,
    opts: ActivityQueryOptions = {},
): Promise<ActivityEvent[]> {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;

    let query = supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

    if (opts.source) query = query.eq('source', opts.source);
    if (opts.eventType) query = query.eq('event_type', opts.eventType);
    if (opts.category) query = query.eq('category', opts.category);
    if (opts.priority) query = query.eq('priority', opts.priority);
    if (opts.sourceId) query = query.eq('source_id', opts.sourceId);
    if (opts.sourceTable) query = query.eq('source_table', opts.sourceTable);
    if (opts.since) query = query.gte('occurred_at', opts.since);
    if (opts.until) query = query.lte('occurred_at', opts.until);
    if (opts.unreadOnly) query = query.is('read_at', null);
    if (opts.archived !== undefined) {
        query = query.eq('is_archived', opts.archived);
    } else {
        query = query.eq('is_archived', false);
    }
    // Full-text search via generated tsvector column
    if (opts.search?.trim()) {
        query = query.textSearch('search_vector', opts.search.trim(), {
            type: 'websearch',
        });
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as ActivityEventRow[]).map(mapActivityRow);
}

export async function getActivityEvent(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<ActivityEvent | null> {
    const result = (await supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle()) as unknown as {
        data: ActivityEventRow | null;
        error: Error | null;
    };
    if (result.error) throw result.error;
    if (!result.data) return null;
    return mapActivityRow(result.data);
}

// ── State mutations ───────────────────────────────────────────────────────────

export async function markEventsRead(
    supabase: SupabaseClient,
    userId: string,
    ids: string[],
): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
        .from('activity_events')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', ids)
        .is('read_at', null);
    if (error) throw error;
}

export async function markEventsUnread(
    supabase: SupabaseClient,
    userId: string,
    ids: string[],
): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
        .from('activity_events')
        .update({ read_at: null })
        .eq('user_id', userId)
        .in('id', ids);
    if (error) throw error;
}

export async function archiveEvents(
    supabase: SupabaseClient,
    userId: string,
    ids: string[],
): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
        .from('activity_events')
        .update({ is_archived: true })
        .eq('user_id', userId)
        .in('id', ids);
    if (error) throw error;
}

export async function unarchiveEvents(
    supabase: SupabaseClient,
    userId: string,
    ids: string[],
): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
        .from('activity_events')
        .update({ is_archived: false })
        .eq('user_id', userId)
        .in('id', ids);
    if (error) throw error;
}

// ── Legacy compat (kept for any callers not yet updated) ──────────────────────

export function recordActivityEvent(
    _event: Omit<ActivityEvent, 'id' | 'createdAt'>,
): Promise<void> {
    // Deprecated — use publishActivityEvent with a SupabaseClient instead.
    console.warn('[activityService] recordActivityEvent is deprecated');
    return Promise.resolve();
}

export async function listActivityEventsForUser(
    supabase: SupabaseClient,
    userId: string,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit: 50 });
}
