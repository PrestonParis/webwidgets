import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyMicrosoftAccount } from '@/app/api/auth/_lib/microsoftOAuth';
import { normalizeGrantedScopes } from '@/lib/auth/oauthConnectionPolicy';
import {
    hasEmailActionScope,
    type EmailActionId,
    type EmailMessage,
} from '@/lib/emailActions/contracts';

const tokenSchema = z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().optional(),
    expires_in: z.number().positive(),
    scope: z.string().min(1),
});

export async function loadMicrosoftActionToken(
    db: SupabaseClient,
    userId: string,
    actionId: EmailActionId,
    message: EmailMessage,
) {
    const result = await db
        .from('user_email_accounts')
        .select(
            'id,provider,email,provider_subject,access_token,refresh_token,expires_at,granted_scopes',
        )
        .eq('id', message.accountId)
        .eq('user_id', userId)
        .single();
    if (result.error) throw new Error('email_account_unavailable');
    const account = z
        .object({
            id: z.uuid(),
            provider: z.literal('microsoft'),
            email: z.email(),
            provider_subject: z.string().min(1),
            access_token: z.string().min(1),
            refresh_token: z.string().nullable(),
            expires_at: z.number().nullable(),
            granted_scopes: z.array(z.string()),
        })
        .parse(result.data);
    if (message.provider !== 'microsoft' || account.email !== message.from)
        throw new Error('email_account_mismatch');
    let token = account.access_token,
        refreshToken = account.refresh_token,
        expiresAt = account.expires_at;
    let scopes = account.granted_scopes;
    if (!expiresAt || expiresAt < Date.now() + 60_000) {
        if (!refreshToken) throw new Error('email_reconnect_required');
        const tenant = encodeURIComponent(
            process.env.MICROSOFT_TENANT_ID ?? 'common',
        );
        const clientId = process.env.MICROSOFT_CLIENT_ID,
            clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            throw new Error('email_provider_not_configured');
        const response = await fetch(
            `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
                signal: AbortSignal.timeout(15_000),
            },
        );
        if (!response.ok) throw new Error('email_refresh_failed');
        const refreshed = tokenSchema.parse(await response.json());
        token = refreshed.access_token;
        refreshToken = refreshed.refresh_token ?? refreshToken;
        expiresAt = Date.now() + refreshed.expires_in * 1000;
        scopes = normalizeGrantedScopes(refreshed.scope);
    }
    const identity = await verifyMicrosoftAccount(token);
    if (
        identity.email !== account.email ||
        identity.subject !== account.provider_subject ||
        !hasEmailActionScope('microsoft', actionId, scopes)
    )
        throw new Error('email_permission_upgrade_required');
    const updated = await db
        .from('user_email_accounts')
        .update({
            access_token: token,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            granted_scopes: scopes,
        })
        .eq('id', account.id)
        .eq('user_id', userId)
        .select('id')
        .single();
    if (updated.error) throw new Error('email_account_unavailable');
    return token;
}
