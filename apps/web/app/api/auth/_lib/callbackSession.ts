import {
    createServerClient,
    parseCookieHeader,
    type CookieOptions,
} from '@supabase/ssr';
import type { NextResponse } from 'next/server';

export function createCallbackSession(request: Pick<Request, 'headers'>) {
    // Cookie parsing must not depend on the hosting runtime's Request wrapper.
    const incoming = parseCookieHeader(request.headers.get('cookie') ?? '')
        .filter((cookie) => cookie.value !== undefined)
        .map((cookie) => ({ name: cookie.name, value: cookie.value! }));
    const pending = new Map<
        string,
        { name: string; value: string; options: CookieOptions }
    >();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey)
        throw new Error('supabase_callback_configuration_missing');
    const client = createServerClient(supabaseUrl, supabaseKey, {
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
    });
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
