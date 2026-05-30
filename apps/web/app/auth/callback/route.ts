import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getLogger } from '@/lib/observability/logger';
import { authFailures } from '@/lib/observability/metrics';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const safeNext = next.startsWith('/') ? next : '/';

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    // ── Inbox-connect flow ────────────────────────────────────────────────────
    // When the user adds a second Gmail account from the Inbox page, we come
    // through this callback with ic=1 and the original user's ID.  We must NOT
    // replace the active session, so we exchange the code with a no-op client
    // (setAll is a no-op → session cookies are never written) and store the new
    // account's tokens under the original user.
    const inboxConnect = searchParams.get('ic');
    const originalUid = searchParams.get('uid');

    if (inboxConnect === '1' && originalUid) {
        const log = getLogger({ operation: 'auth.callback.inbox-connect' });

        const requestCookies = (request.headers.get('cookie') ?? '')
            .split(';')
            .map((c) => {
                const [name = '', ...rest] = c.trim().split('=');
                return { name, value: rest.join('=') };
            });

        // No-op client: can READ existing cookies (needed for PKCE verification)
        // but will NEVER write new session cookies.
        const noopClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => requestCookies,
                    setAll: () => {
                        /* preserve original session */
                    },
                },
            },
        );

        const { data: connectData, error: connectError } =
            await noopClient.auth.exchangeCodeForSession(code);

        if (connectError ?? !connectData.session?.provider_token) {
            log.warn(
                { err: connectError },
                'Inbox-connect code exchange failed',
            );
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        const { session: connectSession } = connectData;
        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Fetch the newly-authorised account's email address.
        let accountEmail = connectSession.user.email ?? '';
        const displayName =
            (connectSession.user.user_metadata?.full_name as
                | string
                | undefined) ?? null;
        try {
            const info = (await (
                await fetch(
                    `https://oauth2.googleapis.com/tokeninfo?access_token=${connectSession.provider_token}`,
                )
            ).json()) as { email?: string };
            if (info.email) accountEmail = info.email;
        } catch {
            /* best effort */
        }

        const expiresAt = Date.now() + 3590 * 1000;

        // Store under the ORIGINAL user's ID (not the new Google account's UID).
        const accountPayload: Record<string, unknown> = {
            user_id: originalUid,
            provider: 'google',
            email: accountEmail,
            display_name: displayName,
            access_token: connectSession.provider_token,
            expires_at: expiresAt,
        };
        if (connectSession.provider_refresh_token) {
            accountPayload.refresh_token =
                connectSession.provider_refresh_token;
        }
        await admin
            .from('user_email_accounts')
            .upsert(accountPayload, { onConflict: 'user_id,provider,email' });

        const tokenPayload: Record<string, unknown> = {
            user_id: originalUid,
            access_token: connectSession.provider_token,
            expires_at: expiresAt,
            has_gmail: true,
            has_calendar: true,
        };
        if (connectSession.provider_refresh_token) {
            tokenPayload.refresh_token = connectSession.provider_refresh_token;
        }
        await admin
            .from('user_tokens')
            .upsert(tokenPayload, { onConflict: 'user_id' });

        log.info({ originalUid, accountEmail }, 'Inbox-connect: account added');

        // Redirect back — original session cookies were never touched.
        const destination = safeNext === '/' ? '/inbox' : safeNext;
        return NextResponse.redirect(`${origin}${destination}`);
    }

    // ── Normal sign-in flow (unchanged) ──────────────────────────────────────

    const response = NextResponse.redirect(`${origin}${safeNext}`);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return (
                        request.headers
                            .get('cookie')
                            ?.split(';')
                            .map((c) => {
                                const [name = '', ...rest] = c
                                    .trim()
                                    .split('=');
                                return { name, value: rest.join('=') };
                            }) ?? []
                    );
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
        const log = getLogger({ operation: 'auth.callback' });
        log.warn({ errorMessage: error?.message }, 'Auth code exchange failed');
        authFailures.inc({ reason: 'exchange_failed' });
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const { session } = data;

    // Persist Google tokens so the Gmail API route can use them.
    // provider_token / provider_refresh_token are only available immediately
    // after the OAuth exchange — this is the only opportunity to capture them.
    if (session.provider_token) {
        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Detect granted scopes (calendar, drive, gmail).
        // Default to true for calendar+gmail since we always request both scopes
        // in signInWithGoogle/connectCalendar. Only override if tokeninfo succeeds.
        let hasCalendar = true;
        let hasDrive = false;
        let hasGmail = true;
        try {
            const tokenInfoRes = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?access_token=${session.provider_token}`,
            );
            if (tokenInfoRes.ok) {
                const tokenInfo: unknown = await tokenInfoRes.json();
                const scope =
                    typeof tokenInfo === 'object' &&
                    tokenInfo !== null &&
                    'scope' in tokenInfo &&
                    typeof (tokenInfo as { scope: unknown }).scope === 'string'
                        ? (tokenInfo as { scope: string }).scope
                        : '';
                if (scope) {
                    hasCalendar = scope.includes('calendar');
                    hasDrive = scope.includes('drive');
                    hasGmail =
                        scope.includes('gmail') ||
                        scope.includes('mail.google');
                }
            }
        } catch {
            // tokeninfo failed — keep defaults (assumes requested scopes were granted)
        }

        // Always include access_token and scope flags. Only include refresh_token
        // if Google returned one (prompt: 'consent' should guarantee it, but guard
        // against accidentally clearing a previously stored refresh_token).
        const upsertPayload: Record<string, unknown> = {
            user_id: session.user.id,
            access_token: session.provider_token,
            // Google access tokens are valid for 3600 s; store expiry in ms
            // to match what google-auth-library expects for expiry_date.
            expires_at: Date.now() + 3590 * 1000,
            has_calendar: hasCalendar,
            has_drive: hasDrive,
            has_gmail: hasGmail,
        };
        if (session.provider_refresh_token) {
            upsertPayload.refresh_token = session.provider_refresh_token;
        }

        const { error: tokenUpsertError } = await admin
            .from('user_tokens')
            .upsert(upsertPayload, { onConflict: 'user_id' });
        if (tokenUpsertError) {
            const log = getLogger({ operation: 'auth.callback.token-persist' });
            log.error(
                { err: tokenUpsertError, userId: session.user.id },
                'Failed to persist Google tokens to user_tokens',
            );
        }

        // Also track this account in user_email_accounts for multi-account support.
        if (hasGmail) {
            let accountEmail = session.user.email ?? '';
            const displayName = session.user.user_metadata?.full_name as
                | string
                | undefined;
            try {
                const tokenInfo: unknown = await (
                    await fetch(
                        `https://oauth2.googleapis.com/tokeninfo?access_token=${session.provider_token}`,
                    )
                ).json();
                if (
                    typeof tokenInfo === 'object' &&
                    tokenInfo !== null &&
                    'email' in tokenInfo
                ) {
                    accountEmail =
                        (tokenInfo as { email: string }).email || accountEmail;
                }
            } catch {
                /* best effort */
            }

            const accountPayload: Record<string, unknown> = {
                user_id: session.user.id,
                provider: 'google',
                email: accountEmail,
                display_name: displayName ?? null,
                access_token: session.provider_token,
                expires_at: Date.now() + 3590 * 1000,
            };
            if (session.provider_refresh_token) {
                accountPayload.refresh_token = session.provider_refresh_token;
            }
            await admin.from('user_email_accounts').upsert(accountPayload, {
                onConflict: 'user_id,provider,email',
            });
        }
    }

    return response;
}
