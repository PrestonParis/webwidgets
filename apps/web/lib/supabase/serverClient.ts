import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function createClients() {
    const cookieStore = await cookies();

    const makeClient = (key: string) =>
        createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                },
            },
        });

    return {
        supabase: makeClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
        supabaseAdmin: makeClient(process.env.SUPABASE_SERVICE_ROLE_KEY!),
    };
}

export async function createTypedClients() {
    const cookieStore = await cookies();
    const makeClient = (key: string) =>
        createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            key,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cookiesToSet) => {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    },
                },
            },
        );

    return {
        supabase: makeClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
        supabaseAdmin: makeClient(process.env.SUPABASE_SERVICE_ROLE_KEY!),
    };
}
