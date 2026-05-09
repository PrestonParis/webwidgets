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
    if (session.provider_token && session.provider_refresh_token) {
        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Detect whether the granted scopes include Google Calendar.
        let hasCalendar = false;
        try {
            const tokenInfoRes = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?access_token=${session.provider_token}`,
            );
            if (tokenInfoRes.ok) {
                const tokenInfo: unknown = await tokenInfoRes.json();
                hasCalendar =
                    typeof tokenInfo === 'object' &&
                    tokenInfo !== null &&
                    'scope' in tokenInfo &&
                    typeof (tokenInfo as { scope: unknown }).scope ===
                        'string' &&
                    (tokenInfo as { scope: string }).scope.includes('calendar');
            }
        } catch {
            // Non-fatal — token info check is best-effort
        }

        await admin.from('user_tokens').upsert(
            {
                user_id: session.user.id,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token,
                // Google access tokens are valid for 3600 s; store expiry in ms
                // to match what google-auth-library expects for expiry_date.
                expires_at: Date.now() + 3590 * 1000,
                has_calendar: hasCalendar,
            },
            { onConflict: 'user_id' },
        );
    }

    return response;
}
