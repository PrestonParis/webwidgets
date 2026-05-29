import type { SupabaseClient } from '@supabase/supabase-js';

export async function getRequestUserId(supabase: SupabaseClient) {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Unauthorized');
    return user.id;
}
