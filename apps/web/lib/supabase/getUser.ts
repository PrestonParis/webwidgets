import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserOrThrow(supabase: SupabaseClient) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) throw new Error('Unauthorized');

    return user;
}
