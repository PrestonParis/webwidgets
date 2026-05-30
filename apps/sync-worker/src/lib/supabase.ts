import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from '../env.js';

// Service-role client — bypasses RLS. Used only in the worker process,
// never in the browser or Next.js request handlers.
// ws is provided explicitly because Node 20 has no native WebSocket.
export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as typeof WebSocket },
    },
);

export interface EmailAccount {
    id: string;
    user_id: string;
    provider: 'google' | 'microsoft';
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
    received_at: string; // ISO timestamp
    raw_date: string;
    /** Full decoded body text. Stored when fetched during ingest. */
    body_text?: string;
}

export async function getAllActiveAccounts(): Promise<EmailAccount[]> {
    const { data, error } = await supabase
        .from('user_email_accounts')
        .select(
            'id, user_id, provider, email, access_token, refresh_token, expires_at',
        );
    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
    return (data ?? []) as EmailAccount[];
}

export async function upsertSnapshots(
    snapshots: EmailSnapshot[],
): Promise<void> {
    if (snapshots.length === 0) return;
    const { error } = await supabase.from('email_snapshots').upsert(snapshots, {
        onConflict: 'user_id,id',
        ignoreDuplicates: false,
    });
    if (error) throw new Error(`Failed to upsert snapshots: ${error.message}`);
}

export async function markAccountSynced(accountId: string): Promise<void> {
    await supabase
        .from('user_email_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', accountId);
}

export async function updateAccountTokens(
    accountId: string,
    accessToken: string,
    expiresAt: number,
): Promise<void> {
    await supabase
        .from('user_email_accounts')
        .update({ access_token: accessToken, expires_at: expiresAt })
        .eq('id', accountId);
}
