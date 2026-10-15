import { google } from 'googleapis';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyGoogleAccount } from '@/app/api/auth/_lib/googleOAuth';
import {
    hasEmailActionScope,
    type EmailActionId,
    type EmailMessage,
} from '@/lib/emailActions/contracts';

export async function loadGmailActionToken(
    db: SupabaseClient,
    userId: string,
    actionId: EmailActionId,
    message: EmailMessage,
) {
    const result = await db
        .from('user_email_accounts')
        .select(
            'id,provider,email,provider_subject,access_token,refresh_token,expires_at',
        )
        .eq('id', message.accountId)
        .eq('user_id', userId)
        .single();
    if (result.error) throw new Error('email_account_unavailable');
    const account = z
        .object({
            id: z.uuid(),
            provider: z.literal('google'),
            email: z.email(),
            provider_subject: z.string().min(1),
            access_token: z.string().min(1),
            refresh_token: z.string().nullable(),
            expires_at: z.number().nullable(),
        })
        .parse(result.data);
    if (message.provider !== 'google' || account.email !== message.from)
        throw new Error('email_account_mismatch');
    let token = account.access_token;
    if (!account.expires_at || account.expires_at < Date.now() + 60_000) {
        if (!account.refresh_token) throw new Error('email_reconnect_required');
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
        );
        auth.setCredentials({ refresh_token: account.refresh_token });
        const refreshed = await auth.refreshAccessToken();
        if (!refreshed.credentials.access_token)
            throw new Error('email_refresh_failed');
        token = refreshed.credentials.access_token;
    }
    const verified = await verifyGoogleAccount(token);
    if (
        verified.email !== account.email ||
        verified.subject !== account.provider_subject ||
        !hasEmailActionScope('google', actionId, verified.scopes)
    )
        throw new Error('email_permission_upgrade_required');
    const updated = await db
        .from('user_email_accounts')
        .update({
            access_token: token,
            expires_at: verified.expiresAt,
            granted_scopes: verified.scopes,
        })
        .eq('id', account.id)
        .eq('user_id', userId)
        .select('id')
        .single();
    if (updated.error) throw new Error('email_account_unavailable');
    return token;
}
