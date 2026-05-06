import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        console.error('Auth exchange failed:', error?.message);
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
        await admin.from('user_tokens').upsert(
            {
                user_id: session.user.id,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token,
                // Google access tokens are valid for 3600 s; store expiry in ms
                // to match what google-auth-library expects for expiry_date.
                expires_at: Date.now() + 3590 * 1000,
            },
            { onConflict: 'user_id' },
        );
    }

    return response;
}
