import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

function createAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                detectSessionInUrl: false,
                persistSession: false,
            },
        },
    );
}

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
        supabaseAdmin: createAdminClient(),
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
        supabaseAdmin: createAdminClient(),
    };
}
