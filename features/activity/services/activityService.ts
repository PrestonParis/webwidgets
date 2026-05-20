import { db } from '@/lib/db/supabase';
import type { ActivityEvent } from '@/features/activity/types/activity';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listActivityEvents(userId: string) {
    const result = await db
        .from('activity_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (result.error) throw result.error;
    return (result.data ?? []) as ActivityEvent[];
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
    return result.data as ActivityEvent;
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
    return (result.data ?? []) as ActivityEvent[];
}
