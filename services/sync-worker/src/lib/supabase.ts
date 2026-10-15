import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import type { WorkerEnv } from '../env.js';

export function createWorkerSupabase(env: WorkerEnv): SupabaseClient {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as typeof WebSocket },
    }) as SupabaseClient;
}

export interface EmailAccountReference {
    id: string;
    user_id: string;
    provider: 'google' | 'microsoft';
}

export interface EmailAccount extends EmailAccountReference {
    email: string;
    access_token: string;
    refresh_token: string | null;
    expires_at: number | null;
}

export interface EmailSnapshot {
    id: string;
    user_id: string;
    account_email: string;
    provider: 'gmail' | 'outlook';
    subject: string;
    sender_email: string;
    sender_name: string;
    snippet: string;
    received_at: string;
    raw_date: string;
    body_text?: string;
}

export async function getActiveAccountReferences(
    client: SupabaseClient,
    userId?: string,
): Promise<EmailAccountReference[]> {
    let query = client
        .from('user_email_accounts')
        .select('id, user_id, provider');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch account references');
    return (data ?? []) as EmailAccountReference[];
}

export async function getAccountForUser(
    client: SupabaseClient,
    userId: string,
    accountId: string,
): Promise<EmailAccount | null> {
    const { data, error } = await client
        .from('user_email_accounts')
        .select(
            'id, user_id, provider, email, access_token, refresh_token, expires_at',
        )
        .eq('id', accountId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error('Failed to fetch scoped email account');
    return data as EmailAccount | null;
}

export async function upsertSnapshots(
    client: SupabaseClient,
    snapshots: EmailSnapshot[],
): Promise<void> {
    if (snapshots.length === 0) return;
    const { error } = await client.from('email_snapshots').upsert(snapshots, {
        onConflict: 'user_id,id',
        ignoreDuplicates: false,
    });
    if (error) throw new Error('Failed to persist email snapshots');
}

export async function markAccountSynced(
    client: SupabaseClient,
    userId: string,
    accountId: string,
): Promise<void> {
    const { error } = await client
        .from('user_email_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', userId);
    if (error) throw new Error('Failed to mark email account synced');
}

export async function updateAccountTokens(
    client: SupabaseClient,
    userId: string,
    accountId: string,
    accessToken: string,
    expiresAt: number,
    refreshToken?: string,
): Promise<void> {
    const { error } = await client
        .from('user_email_accounts')
        .update({
            access_token: accessToken,
            expires_at: expiresAt,
            ...(refreshToken ? { refresh_token: refreshToken } : {}),
        })
        .eq('id', accountId)
        .eq('user_id', userId);
    if (error) throw new Error('Failed to update scoped account token');
}
