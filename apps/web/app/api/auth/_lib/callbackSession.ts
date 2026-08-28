import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, type NextResponse } from 'next/server';

export function createCallbackSession(request: Request) {
    const incoming = new NextRequest(request).cookies.getAll();
    const pending = new Map<
        string,
        { name: string; value: string; options: CookieOptions }
    >();
    const client = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => {
                    const values = new Map(
                        incoming.map((cookie) => [cookie.name, cookie]),
                    );
                    for (const cookie of pending.values())
                        values.set(cookie.name, cookie);
                    return [...values.values()];
                },
                setAll: (values) => {
                    for (const value of values) pending.set(value.name, value);
                },
            },
        },
    );
    return {
        client,
        async writeSanitizedSession(
            response: NextResponse,
            session: { access_token: string; refresh_token: string },
        ) {
            // Exchange results contain provider credentials; never flush those
            // cookies. Rebuild a Supabase-only session before publishing it.
            const { data, error } = await client.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            });
            if (
                error ||
                !data.session ||
                data.session.provider_token ||
                data.session.provider_refresh_token
            ) {
                throw new Error('session_sanitization_failed');
            }
            for (const { name, value, options } of pending.values())
                response.cookies.set(name, value, options);
        },
    };
}
