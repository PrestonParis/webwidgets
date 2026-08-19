import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineQuery } from '@/features/news/schemas/timelineFeedSchemas';
import {
    mapSourceHealth,
    mapTimelineRows,
    type ConnectionHealthRow,
    type TimelineRow,
} from '@/features/news/services/timelineFeed';
import type { TimelineFeedResponse } from '@/features/news/types/timelineFeed';

interface TimelineCursor {
    occurredAt: string;
    id: string;
}

function encodeCursor(cursor: TimelineCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(value: string): TimelineCursor {
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    } catch {
        throw new Error('BAD_CURSOR');
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('BAD_CURSOR');
    const cursor = parsed as Record<string, unknown>;
    if (
        typeof cursor['occurredAt'] !== 'string' ||
        Number.isNaN(Date.parse(cursor['occurredAt'])) ||
        typeof cursor['id'] !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(cursor['id'])
    )
        throw new Error('BAD_CURSOR');
    return { occurredAt: cursor['occurredAt'], id: cursor['id'] };
}

async function loadTimelineRows(
    db: SupabaseClient,
    userId: string,
    filters: TimelineQuery,
) {
    let query = db
        .from('timeline_events')
        .select(
            'id,event_type,source_type,title,summary,occurred_at,ingested_at,updated_at,state,revision,source_record_table,source_record_id,metadata',
        )
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('state', ['active', 'corrected', 'retracted'])
        .gt('expires_at', new Date().toISOString())
        .order('occurred_at', { ascending: false })
        .order('id', { ascending: false });
    if (filters.sourceTypes.length)
        query = query.in('source_type', filters.sourceTypes);
    if (filters.eventTypes.length)
        query = query.in('event_type', filters.eventTypes);
    if (filters.from) query = query.gte('occurred_at', filters.from);
    if (filters.to) query = query.lte('occurred_at', filters.to);
    if (filters.cursor) {
        const cursor = decodeCursor(filters.cursor);
        query = query.or(
            `occurred_at.lt.${cursor.occurredAt},and(occurred_at.eq.${cursor.occurredAt},id.lt.${cursor.id})`,
        );
    }
    const result = await query.limit(filters.limit + 1);
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []) as unknown as TimelineRow[];
}

async function loadAvailableFilters(db: SupabaseClient, userId: string) {
    const result = await db
        .from('timeline_events')
        .select('source_type,event_type')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('state', ['active', 'corrected', 'retracted'])
        .gt('expires_at', new Date().toISOString())
        .limit(500);
    if (result.error) return { sourceTypes: [], eventTypes: [] };
    const rows = (result.data ?? []) as unknown as Array<{
        source_type: string;
        event_type: string;
    }>;
    return {
        sourceTypes: [...new Set(rows.map((row) => row.source_type))].sort(),
        eventTypes: [...new Set(rows.map((row) => row.event_type))].sort(),
    };
}

async function loadSourceRows(db: SupabaseClient, userId: string) {
    const result = await db
        .from('integration_connections')
        .select(
            'id,provider_id,state,sync_status,consecutive_failures,last_checked_at,last_sync_succeeded_at,next_sync_at,disabled_at,disconnected_at,sync_error_code,fetch_interval_minutes,external_account_id,source_url,metadata,created_at',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []) as unknown as ConnectionHealthRow[];
}

export async function queryTimelineFeed(
    db: SupabaseClient,
    userId: string,
    filters: TimelineQuery,
): Promise<TimelineFeedResponse> {
    const rows = await loadTimelineRows(db, userId, filters);
    const available = await loadAvailableFilters(db, userId);
    const hasMore = rows.length > filters.limit;
    const pageRows = rows.slice(0, filters.limit);
    let sources: ReturnType<typeof mapSourceHealth> = [];
    let sourceHealthUnavailable = false;
    try {
        sources = mapSourceHealth(await loadSourceRows(db, userId));
    } catch {
        sourceHealthUnavailable = true;
    }
    const last = pageRows.at(-1);
    return {
        items: mapTimelineRows(pageRows),
        sources,
        availableSourceTypes: available.sourceTypes,
        availableEventTypes: available.eventTypes,
        generatedAt: new Date().toISOString(),
        nextCursor:
            hasMore && last
                ? encodeCursor({ occurredAt: last.occurred_at, id: last.id })
                : null,
        hasMore,
        sourceHealthUnavailable,
    };
}
