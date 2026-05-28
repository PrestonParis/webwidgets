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
        let hasCalendar = false;
        let hasDrive = false;
        let hasGmail = false;
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
                hasCalendar = scope.includes('calendar');
                hasDrive = scope.includes('drive');
                hasGmail =
                    scope.includes('gmail') || scope.includes('mail.google');
            }
        } catch {
            // Non-fatal — token info check is best-effort
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

        await admin
            .from('user_tokens')
            .upsert(upsertPayload, { onConflict: 'user_id' });

        // Also track this account in user_email_accounts for multi-account support.
        if (hasGmail) {
            let accountEmail = session.user.email ?? '';
            let displayName = session.user.user_metadata?.full_name as
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
            await admin
                .from('user_email_accounts')
                .upsert(accountPayload, {
                    onConflict: 'user_id,provider,email',
                });
        }
    }

    return response;
}
