import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { pkceChallenge } from '@/lib/auth/oauthConnectionPolicy';
import {
    beginConnectionAttempt,
    setConnectionCookie,
} from '@/app/api/auth/_lib/connectionAttempt';
import {
    microsoftRedirectUri,
    microsoftReadScopes,
} from '@/app/api/auth/_lib/microsoftOAuth';

export async function GET(req: Request) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId)
        return NextResponse.json(
            { error: 'Microsoft integration is not configured.' },
            { status: 503 },
        );
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase).catch(() => null);
    if (!user) return NextResponse.redirect(new URL('/login', req.url));
    try {
        const url = new URL(req.url);
        const attempt = await beginConnectionAttempt(
            user.id,
            'microsoft',
            url.searchParams.get('redirect'),
        );
        if (!attempt.verifier) throw new Error('oauth_verifier_missing');
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: microsoftRedirectUri(req),
            scope: microsoftReadScopes,
            state: attempt.state,
            prompt: 'select_account',
            response_mode: 'query',
            code_challenge: pkceChallenge(attempt.verifier),
            code_challenge_method: 'S256',
        });
        const tenant = encodeURIComponent(
            process.env.MICROSOFT_TENANT_ID ?? 'common',
        );
        const response = NextResponse.redirect(
            `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`,
        );
        setConnectionCookie(response, 'microsoft', attempt.state);
        return response;
    } catch {
        return NextResponse.json(
            { error: 'oauth_connection_failed' },
            { status: 503 },
        );
    }
}
