import { z } from 'zod';
import { normalizeGrantedScopes } from '@/lib/auth/oauthConnectionPolicy';

export const microsoftReadScopes =
    'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access';

export const microsoftEmailActionScopes =
    'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access';

export function microsoftRedirectUri(req: Request) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    return new URL('/api/auth/microsoft/callback', origin).href;
}

export async function exchangeMicrosoftCode(
    req: Request,
    code: string,
    verifier: string,
) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('microsoft_not_configured');
    const tenant = encodeURIComponent(
        process.env.MICROSOFT_TENANT_ID ?? 'common',
    );
    const response = await fetch(
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: microsoftRedirectUri(req),
                grant_type: 'authorization_code',
                code_verifier: verifier,
            }),
            signal: AbortSignal.timeout(15_000),
        },
    );
    if (!response.ok) throw new Error('microsoft_code_exchange_failed');
    const token = z
        .object({
            access_token: z.string().min(1),
            refresh_token: z.string().optional(),
            expires_in: z.number().positive(),
            scope: z.string().min(1),
        })
        .parse(await response.json());
    const scopes = normalizeGrantedScopes(token.scope);
    if (!scopes.some((s) => s === 'Mail.Read' || s === 'Mail.ReadWrite'))
        throw new Error('microsoft_mail_scope_missing');
    const account = await verifyMicrosoftAccount(token.access_token);
    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + token.expires_in * 1000,
        scopes,
        ...account,
    };
}

export async function verifyMicrosoftAccount(accessToken: string) {
    const me = await fetch(
        'https://graph.microsoft.com/v1.0/me?$select=id,mail,displayName,userPrincipalName',
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(15_000),
        },
    );
    if (!me.ok) throw new Error('microsoft_identity_verification_failed');
    const account = z
        .object({
            id: z.string().min(1),
            mail: z.string().nullable().optional(),
            userPrincipalName: z.string().optional(),
            displayName: z.string().nullable().optional(),
        })
        .parse(await me.json());
    const email = z
        .email()
        .parse(account.mail ?? account.userPrincipalName)
        .toLowerCase();
    return {
        email,
        displayName: account.displayName ?? null,
        subject: account.id,
    };
}
