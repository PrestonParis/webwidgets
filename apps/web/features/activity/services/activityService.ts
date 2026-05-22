import { db } from '@/lib/db/supabase';
import type { ActivityEvent } from '@/features/activity/types/activity';
import type { SupabaseClient } from '@supabase/supabase-js';

type ActivityEventRow = {
    id: string;
    user_id: string;
    source: ActivityEvent['source'];
    severity: ActivityEvent['severity'];
    title: string;
    body?: string | null;
    created_at?: string;
    read_at?: string | null;
};

function mapActivityEvent(row: ActivityEventRow): ActivityEvent {
    return {
        id: row.id,
        userId: row.user_id,
        source: row.source,
        severity: row.severity,
        title: row.title,
        ...(row.body ? { body: row.body } : {}),
        createdAt: row.created_at ?? new Date().toISOString(),
        ...(row.read_at ? { readAt: row.read_at } : {}),
    };
}

export async function listActivityEvents(userId: string) {
    const result = await db
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (result.error) throw result.error;
    return ((result.data ?? []) as ActivityEventRow[]).map(mapActivityEvent);
}

export async function recordActivityEvent(
    event: Omit<ActivityEvent, 'id' | 'createdAt'>,
) {
    const result = await db
        .from('activity_events')
        .insert({
            user_id: event.userId,
            source: event.source,
            severity: event.severity,
            title: event.title,
            body: event.body,
            read_at: event.readAt,
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return mapActivityEvent(result.data as ActivityEventRow);
}

export async function listActivityEventsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (result.error) throw result.error;
    return ((result.data ?? []) as ActivityEventRow[]).map(mapActivityEvent);
}
