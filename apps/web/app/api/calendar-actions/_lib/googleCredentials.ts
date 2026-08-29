import { google } from 'googleapis';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyGoogleAccount } from '@/app/api/auth/_lib/googleOAuth';
import type { CalendarActionPayload } from '@/lib/calendarActions/contracts';

export async function loadCalendarActionToken(
    db: SupabaseClient,
    userId: string,
    event: CalendarActionPayload,
) {
    const result = await db
        .from('user_email_accounts')
        .select(
            'id,provider,email,provider_subject,access_token,refresh_token,expires_at',
        )
        .eq('id', event.accountId)
        .eq('user_id', userId)
        .single();
    if (result.error) throw new Error('calendar_account_unavailable');
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
    let token = account.access_token;
    if (!account.expires_at || account.expires_at < Date.now() + 60_000) {
        if (!account.refresh_token)
            throw new Error('calendar_reconnect_required');
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
        );
        auth.setCredentials({ refresh_token: account.refresh_token });
        const refreshed = await auth.refreshAccessToken();
        if (!refreshed.credentials.access_token)
            throw new Error('calendar_refresh_failed');
        token = refreshed.credentials.access_token;
    }
    const verified = await verifyGoogleAccount(token);
    if (
        verified.email !== account.email ||
        verified.subject !== account.provider_subject ||
        !verified.scopes.some((scope) =>
            ['calendar.events', 'calendar'].includes(scope),
        )
    )
        throw new Error('calendar_permission_required');
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
    if (updated.error) throw new Error('calendar_account_unavailable');
    return token;
}
