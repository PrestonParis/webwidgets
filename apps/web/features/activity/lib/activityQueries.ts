// Reusable querying utilities for the activity event stream.
// These are thin wrappers over activityService that encode common access patterns
// so dashboard widgets, notification systems, and the activity page can share them.

import type { SupabaseClient } from '@supabase/supabase-js';
import { listActivityEvents } from '@/features/activity/services/activityService';
import type {
    ActivityEvent,
    ActivityEventCategory,
    ActivityEventSource,
    ActivityQueryOptions,
} from '@/features/activity/types/activity';

export async function queryRecentEvents(
    supabase: SupabaseClient,
    userId: string,
    limit = 20,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit });
}

export async function queryUnreadEvents(
    supabase: SupabaseClient,
    userId: string,
    limit = 50,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit, unreadOnly: true });
}

export async function queryArchivedEvents(
    supabase: SupabaseClient,
    userId: string,
    limit = 50,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit, archived: true });
}

export async function queryBySource(
    supabase: SupabaseClient,
    userId: string,
    source: ActivityEventSource,
    limit = 50,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit, source });
}

export async function queryByCategory(
    supabase: SupabaseClient,
    userId: string,
    category: ActivityEventCategory,
    limit = 50,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { limit, category });
}

export async function queryByDateRange(
    supabase: SupabaseClient,
    userId: string,
    since: string,
    until: string,
    opts: Omit<ActivityQueryOptions, 'since' | 'until'> = {},
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, { ...opts, since, until });
}

export async function queryForEntity(
    supabase: SupabaseClient,
    userId: string,
    sourceTable: string,
    sourceId: string,
    limit = 20,
): Promise<ActivityEvent[]> {
    return listActivityEvents(supabase, userId, {
        limit,
        sourceTable,
        sourceId,
    });
}

export async function countUnread(
    supabase: SupabaseClient,
    userId: string,
): Promise<number> {
    const { count, error } = await supabase
        .from('activity_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_archived', false)
        .is('read_at', null);
    if (error) {
        console.error('[activityQueries] countUnread error', error);
        return 0;
    }
    return count ?? 0;
}
