import type { SupabaseClient } from '@supabase/supabase-js';
import { ProviderError } from '@/lib/connectors/providerError';
import type { MicrosoftTokens } from '@/lib/connectors/microsoft/graphConnector';

export async function getMicrosoftTokens(
    supabaseAdmin: SupabaseClient,
    userId: string,
): Promise<MicrosoftTokens> {
    const { data } = await supabaseAdmin
        .from('user_tokens')
        .select(
            'has_microsoft, microsoft_access_token, microsoft_refresh_token',
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (!data?.has_microsoft || !data?.microsoft_access_token) {
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'Microsoft not connected',
        );
    }

    return {
        accessToken: data.microsoft_access_token,
        refreshToken: data.microsoft_refresh_token ?? undefined,
    };
}
