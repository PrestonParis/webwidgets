import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { safeOAuthRedirect } from '@/lib/auth/oauthConnectionPolicy';
import { createCallbackSession } from '@/app/api/auth/_lib/callbackSession';
import { consumeConnectionAttempt } from '@/app/api/auth/_lib/connectionAttempt';
import { verifyGoogleAccount } from '@/app/api/auth/_lib/googleOAuth';
import { persistProviderAccount } from '@/app/api/auth/_lib/providerAccount';
import { safeCallbackFailure } from '@/app/api/auth/_lib/callbackDiagnostics';
import { getLogger } from '@/lib/observability/logger';

async function connectionOwner(request: Request) {
    const url = new URL(request.url);
    if (url.searchParams.get('ic') !== '1') return null;
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);
    const attempt = await consumeConnectionAttempt(
        user.id,
        'google',
        url.searchParams.get('state'),
    );
    return { userId: user.id, redirectPath: attempt.redirectPath };
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    let stage = 'request_validation';
    try {
        const code = url.searchParams.get('code');
        if (!code || url.searchParams.has('error'))
            throw new Error('oauth_code_missing');
        stage = 'connection_owner';
        const owner = await connectionOwner(request);
        stage = 'session_client';
        const callback = createCallbackSession(request);
        stage = 'code_exchange';
        const { data, error } =
            await callback.client.auth.exchangeCodeForSession(code);
        const session = data.session;
        if (error) throw error;
        if (!session) throw new Error('oauth_code_exchange_failed');
        if (session.provider_token) {
            stage = 'provider_verification';
            const account = await verifyGoogleAccount(
                session.provider_token,
                session.provider_refresh_token,
            );
            if (
                owner &&
                !account.scopes.some((scope) =>
                    [
                        'gmail.readonly',
                        'gmail.modify',
                        'https://mail.google.com/',
                    ].includes(scope),
                )
            )
                throw new Error('google_mail_scope_missing');
            stage = 'credential_persistence';
            await persistProviderAccount(
                owner?.userId ?? session.user.id,
                'google',
                account,
            );
        } else if (owner) throw new Error('google_token_missing');
        const redirect =
            owner?.redirectPath ??
            safeOAuthRedirect(url.searchParams.get('next'), '/');
        const response = NextResponse.redirect(new URL(redirect, url.origin));
        stage = 'session_sanitization';
        if (!owner) await callback.writeSanitizedSession(response, session);
        return response;
    } catch (error) {
        // Provider errors can contain credentials; log only allowlisted categories.
        getLogger({ operation: 'googleOAuthCallback' }).error(
            { stage, reason: safeCallbackFailure(error) },
            'Google OAuth callback failed',
        );
        return NextResponse.redirect(
            new URL('/auth/auth-code-error', url.origin),
        );
    }
}
