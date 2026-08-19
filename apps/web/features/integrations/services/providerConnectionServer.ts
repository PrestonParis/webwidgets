import type { SupabaseClient } from '@supabase/supabase-js';

export async function disconnectProviderConnection(
    supabase: SupabaseClient,
    connectionId: string,
) {
    const result = await supabase.rpc('disconnect_provider_connection', {
        connection_id: connectionId,
    });
    if (result.error) throw result.error;
    return result.data === true;
}
