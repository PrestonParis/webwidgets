import { SupabaseClient } from '@supabase/supabase-js';

export async function getGoogleTokens(
    supabaseAdmin: SupabaseClient,
    userId: string,
) {
    const { data } = await supabaseAdmin
        .from('user_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .maybeSingle();

    if (!data?.access_token) throw new Error('No Google token');

    return data;
}
