import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getLogger } from '@/lib/observability/logger';

const MS_TOKEN_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';

const SCOPES = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
].join(' ');

function siteUrl(req: Request): string {
    const url = new URL(req.url);
    return process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;
}

interface MsTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    error?: string;
    error_description?: string;
}

export async function GET(req: Request) {
    const log = getLogger({ operation: 'auth.microsoft.callback' });
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
        log.warn({ error: errorParam }, 'Microsoft OAuth error');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? 'common';

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const { supabase, supabaseAdmin } = await createClients();
    let userId: string;
    try {
        const user = await getUserOrThrow(supabase);
        userId = user.id;
    } catch {
        return NextResponse.redirect(`${origin}/login`);
    }

    const callbackUrl = `${siteUrl(req)}/api/auth/microsoft/callback`;
    const tokenUrl = MS_TOKEN_URL.replace('{tenant}', tenantId);

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
        scope: SCOPES,
    });

    let tokens: MsTokenResponse;
    try {
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        tokens = await res.json() as MsTokenResponse;
        if (tokens.error) {
            log.error({ error: tokens.error, desc: tokens.error_description }, 'Token exchange failed');
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
    } catch (err) {
        log.error({ err }, 'Microsoft token exchange request failed');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    await supabaseAdmin
        .from('user_tokens')
        .upsert(
            {
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token ?? null,
                expires_at: Date.now() + tokens.expires_in * 1000,
                has_microsoft: true,
                microsoft_access_token: tokens.access_token,
                microsoft_refresh_token: tokens.refresh_token ?? null,
            },
            { onConflict: 'user_id' },
        );

    log.info({ userId }, 'Microsoft account connected');

    const redirectPath = state ? decodeURIComponent(state) : '/inbox';
    const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/inbox';
    return NextResponse.redirect(`${origin}${safeRedirect}`);
}
