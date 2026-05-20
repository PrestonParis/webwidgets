import type { SupabaseClient } from '@supabase/supabase-js';

export interface DateRange {
    from: string; // ISO date string
    to: string;
}

export interface DailyCount {
    date: string;
    count: number;
}

export interface EventTypeSummary {
    type: string;
    count: number;
}

/** Counts events grouped by day within a date range. */
export async function countEventsByDay(
    admin: SupabaseClient,
    { from, to }: DateRange,
    eventType?: string,
): Promise<DailyCount[]> {
    let query = admin
        .from('analytics_events')
        .select('created_at')
        .gte('created_at', from)
        .lte('created_at', to);

    if (eventType) query = query.eq('type', eventType);

    const { data } = await query;
    if (!data) return [];

    const counts = new Map<string, number>();
    for (const row of data) {
        const day = (row.created_at as string).slice(0, 10);
        counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/** Counts total events for a list of types within a date range. */
export async function countEventsByType(
    admin: SupabaseClient,
    { from, to }: DateRange,
    types?: string[],
): Promise<EventTypeSummary[]> {
    let query = admin
        .from('analytics_events')
        .select('type')
        .gte('created_at', from)
        .lte('created_at', to);

    if (types && types.length > 0) query = query.in('type', types);

    const { data } = await query;
    if (!data) return [];

    const counts = new Map<string, number>();
    for (const row of data) {
        const t = row.type as string;
        counts.set(t, (counts.get(t) ?? 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
}

/** Counts distinct active users within a date range. */
export async function countActiveUsers(
    admin: SupabaseClient,
    { from, to }: DateRange,
): Promise<number> {
    const { data } = await admin
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', from)
        .lte('created_at', to)
        .not('user_id', 'is', null);

    if (!data) return 0;
    return new Set(data.map((r) => r.user_id as string)).size;
}

/** Fetches recent events with pagination for the event explorer. */
export async function fetchRecentEvents(
    admin: SupabaseClient,
    { from, to }: DateRange,
    opts: { type?: string; limit?: number; offset?: number },
) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;

    let query = admin
        .from('analytics_events')
        .select('id, user_id, type, source, metadata, created_at')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (opts.type) query = query.eq('type', opts.type);

    const { data, error } = await query;
    return { events: data ?? [], error };
}
