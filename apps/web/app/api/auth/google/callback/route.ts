import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { safeOAuthRedirect } from '@/lib/auth/oauthConnectionPolicy';
import { createCallbackSession } from '@/app/api/auth/_lib/callbackSession';
import { consumeConnectionAttempt } from '@/app/api/auth/_lib/connectionAttempt';
import { verifyGoogleAccount } from '@/app/api/auth/_lib/googleOAuth';
import { persistProviderAccount } from '@/app/api/auth/_lib/providerAccount';

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
    try {
        const code = url.searchParams.get('code');
        if (!code || url.searchParams.has('error'))
            throw new Error('oauth_code_missing');
        const owner = await connectionOwner(request);
        const callback = createCallbackSession(request);
        const { data, error } =
            await callback.client.auth.exchangeCodeForSession(code);
        const session = data.session;
        if (error || !session) throw new Error('oauth_code_exchange_failed');
        if (session.provider_token) {
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
        if (!owner) await callback.writeSanitizedSession(response, session);
        return response;
    } catch {
        return NextResponse.redirect(
            new URL('/auth/auth-code-error', url.origin),
        );
    }
}
