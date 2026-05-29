import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Retrieves the user's stored model API key for the given provider.
 * Returns null if not set.
 */
export async function getModelKey(
    supabase: SupabaseClient,
    userId: string,
    provider: 'anthropic' | 'openai',
): Promise<string | null> {
    const { data } = await supabase
        .from('user_model_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider', provider)
        .maybeSingle();
    if (!data) return null;
    const row = data as unknown as { api_key_encrypted: string };
    return row.api_key_encrypted;
}
