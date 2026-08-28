import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    matchingOAuthState,
    newOAuthSecret,
    oauthDigest,
    safeOAuthRedirect,
} from '@/lib/auth/oauthConnectionPolicy';

type Provider = 'google' | 'microsoft';
const cookieName = (provider: Provider) => `ww-oauth-${provider}`;

export async function beginConnectionAttempt(
    userId: string,
    provider: Provider,
    redirect: string | null,
) {
    const state = newOAuthSecret();
    const verifier = provider === 'microsoft' ? newOAuthSecret() : null;
    const db = createAdminClient();
    await db
        .from('oauth_connection_attempts')
        .delete()
        .lt('expires_at', new Date().toISOString());
    const result = await db.from('oauth_connection_attempts').insert({
        state_hash: oauthDigest(state),
        user_id: userId,
        provider,
        redirect_path: safeOAuthRedirect(redirect),
        code_verifier: verifier,
    });
    if (result.error) throw new Error('oauth_state_persistence_failed');
    return { state, verifier };
}

export function setConnectionCookie(
    response: NextResponse,
    provider: Provider,
    state: string,
) {
    response.cookies.set(cookieName(provider), state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 600,
    });
}

export async function consumeConnectionAttempt(
    userId: string,
    provider: Provider,
    state: string | null,
) {
    const store = await cookies();
    const supplied = store.get(cookieName(provider))?.value;
    if (!matchingOAuthState(state, supplied) || !state)
        throw new Error('oauth_state_invalid');
    store.delete(cookieName(provider));
    const result = await createAdminClient().rpc(
        'consume_oauth_connection_attempt',
        {
            p_state_hash: oauthDigest(state),
            p_user_id: userId,
            p_provider: provider,
        },
    );
    const row = (
        result.data as Array<{
            redirect_path: string;
            code_verifier: string | null;
        }> | null
    )?.[0];
    if (result.error || !row)
        throw new Error('oauth_state_expired_or_replayed');
    return {
        redirectPath: safeOAuthRedirect(row.redirect_path),
        verifier: row.code_verifier,
    };
}
