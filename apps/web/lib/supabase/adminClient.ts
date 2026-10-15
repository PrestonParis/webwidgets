import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Cookie-free admin client for use in webhooks and cron workers that have
// no incoming request session. Always uses the service role key.
export function createAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}
