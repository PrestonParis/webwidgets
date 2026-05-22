import { db } from '@/lib/db/supabase';
import type { IntegrationConnection } from '@/features/integrations/types/integrations';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listIntegrationConnections(userId: string) {
    const { data, error } = await db
        .from('integration_connections')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as IntegrationConnection[];
}

export async function listIntegrationConnectionsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('integration_connections')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as IntegrationConnection[];
}
