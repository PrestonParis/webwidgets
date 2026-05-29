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

    const result: MicrosoftTokens = {
        accessToken: data.microsoft_access_token as string,
    };
    if (data.microsoft_refresh_token) {
        result.refreshToken = data.microsoft_refresh_token as string;
    }
    return result;
}
