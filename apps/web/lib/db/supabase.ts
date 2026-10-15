import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            flowType: 'pkce',
        },
    },
);

// Untyped client for tables not yet reflected in the generated schema (e.g. new migrations).
export const db: SupabaseClient = supabase;
