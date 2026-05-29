import type { SupabaseClient } from '@supabase/supabase-js';

export interface PersistedNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    entityType: string | null;
    entityId: string | null;
    href: string | null;
    read: boolean;
    createdAt: string;
}

interface CreateNotificationInput {
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
    href?: string;
}

interface ListNotificationsOptions {
    unreadOnly?: boolean;
    limit?: number;
}

function rowToNotification(
    row: Record<string, unknown>,
): PersistedNotification {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        type: row.type as string,
        title: row.title as string,
        body: (row.body as string | null) ?? null,
        entityType: (row.entity_type as string | null) ?? null,
        entityId: (row.entity_id as string | null) ?? null,
        href: (row.href as string | null) ?? null,
        read: (row.read as boolean) ?? false,
        createdAt: row.created_at as string,
    };
}

export async function createNotification(
    supabase: SupabaseClient,
    userId: string,
    data: CreateNotificationInput,
): Promise<PersistedNotification> {
    const result = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: data.type,
            title: data.title,
            ...(data.body !== undefined ? { body: data.body } : {}),
            ...(data.entityType !== undefined
                ? { entity_type: data.entityType }
                : {}),
            ...(data.entityId !== undefined
                ? { entity_id: data.entityId }
                : {}),
            ...(data.href !== undefined ? { href: data.href } : {}),
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToNotification(result.data as unknown as Record<string, unknown>);
}

export async function listNotifications(
    supabase: SupabaseClient,
    userId: string,
    opts?: ListNotificationsOptions,
): Promise<PersistedNotification[]> {
    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(opts?.limit ?? 50);

    if (opts?.unreadOnly) {
        query = query.eq('read', false);
    }

    const result = await query;
    if (result.error) throw result.error;
    return ((result.data ?? []) as unknown as Record<string, unknown>[]).map(
        rowToNotification,
    );
}

export async function markRead(
    supabase: SupabaseClient,
    userId: string,
    notificationId: string,
): Promise<void> {
    const result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('id', notificationId);
    if (result.error) throw result.error;
}

export async function markAllRead(
    supabase: SupabaseClient,
    userId: string,
): Promise<void> {
    const result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (result.error) throw result.error;
}
