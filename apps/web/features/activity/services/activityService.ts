import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ActivityEvent,
    ActivityEventInput,
    ActivityQueryOptions,
    ActivityEventSeverity,
    ActivityEventPriority,
    ActivityEventCategory,
    ActivityEventSource,
    RelatedEntity,
} from '@/features/activity/types/activity';

// ── DB row shape ──────────────────────────────────────────────────────────────

type ActivityEventRow = {
    id: string;
    user_id: string;
    source: string;
    event_type?: string | null;
    source_id?: string | null;
    source_table?: string | null;
    severity?: string | null;
    priority?: string | null;
    category?: string | null;
    title: string;
    body?: string | null;
    is_archived?: boolean | null;
    read_at?: string | null;
    occurred_at?: string | null;
    created_at?: string | null;
    related_entities?: unknown;
    metadata?: Record<string, unknown> | null;
    action_url?: string | null;
};

function mapRow(row: ActivityEventRow): ActivityEvent {
    const now = new Date().toISOString();
    return {
        id: row.id,
        userId: row.user_id,
        source: row.source as ActivityEventSource,
        ...(row.event_type ? { eventType: row.event_type } : {}),
        ...(row.source_id ? { sourceId: row.source_id } : {}),
        ...(row.source_table ? { sourceTable: row.source_table } : {}),
        severity: (row.severity as ActivityEventSeverity) ?? 'info',
        priority: (row.priority as ActivityEventPriority) ?? 'normal',
        category: (row.category as ActivityEventCategory) ?? 'system',
        title: row.title,
        ...(row.body ? { body: row.body } : {}),
        isArchived: row.is_archived ?? false,
        ...(row.read_at ? { readAt: row.read_at } : {}),
        occurredAt: row.occurred_at ?? row.created_at ?? now,
        createdAt: row.created_at ?? now,
        relatedEntities: Array.isArray(row.related_entities)
            ? (row.related_entities as RelatedEntity[])
            : [],
        metadata: row.metadata ?? {},
        ...(row.action_url ? { actionUrl: row.action_url } : {}),
    };
}

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
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return mapRow(result.data as ActivityEventRow);
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

        // Bridge critical/urgent activity events into notifications table
        // so they appear in any notification UI alongside the activity feed.
        if (input.severity === 'critical' || input.priority === 'urgent') {
            void supabase
                .from('notifications')
                .insert({
                    user_id: input.userId,
                    type: input.eventType ?? input.source,
                    title: input.title,
                    body: input.body ?? null,
                    entity_type: input.sourceTable ?? null,
                    // entity_id is uuid — only set when sourceId looks like a UUID
                    ...(input.sourceId &&
                    /^[0-9a-f-]{36}$/i.test(input.sourceId)
                        ? { entity_id: input.sourceId }
                        : {}),
                    href: input.actionUrl ?? null,
                    read: false,
                })
                .then(({ error }) => {
                    if (error) {
                        // Notification table may not exist — non-fatal
                        console.error(
                            '[activityService] notification bridge failed',
                            error.message,
                        );
                    }
                });
        }

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
    return ((data ?? []) as ActivityEventRow[]).map(mapRow);
}

export async function getActivityEvent(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<ActivityEvent | null> {
    const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRow(data as ActivityEventRow);
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

export async function recordActivityEvent(
    _event: Omit<ActivityEvent, 'id' | 'createdAt'>,
): Promise<void> {
    // Deprecated — use publishActivityEvent with a SupabaseClient instead.
    console.warn('[activityService] recordActivityEvent is deprecated');
}

export async function listActivityEventsForUser(
    supabase: SupabaseClient,
    userId: string,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit: 50 });
}
