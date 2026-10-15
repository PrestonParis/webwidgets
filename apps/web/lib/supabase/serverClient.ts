import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// `Database` used to be missing several RPC functions and a table
// (worker_runtime_heartbeats, get_v1_operations_snapshot,
// mark_command_center_seen, create/trigger_v1_automation_template), which is
// why an "untyped" admin client existed as an escape hatch for `.rpc()`
// callers — see git history on this file. `types/supabase.ts` is now
// regenerated from the linked project's actual schema, so a single typed
// client covers every caller; keep it regenerated after schema changes
// (`npx supabase gen types typescript --linked --schema public,graphql_public`).

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

// Retained as an alias so existing `createTypedClients()` call sites keep
// working; `createClients()` is fully typed now, so the two are identical.
export const createTypedClients = createClients;
