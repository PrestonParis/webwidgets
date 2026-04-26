import { createServerClient } from '@supabase/ssr';
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
                                const [name, ...rest] = c.trim().split('=');
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

    return response;
}
