import { createAdminClient } from '@/lib/supabase/adminClient';

const PROVIDER_ENV_ALIASES: Record<string, string[]> = {
    github: ['GITHUB_TOKEN', 'GITHUB_API_KEY', 'GITHUB_PAT'],
    linear: ['LINEAR_API_KEY', 'LINEAR_TOKEN'],
};

export function getProviderEnvKey(provider: string): string | null {
    const aliases = PROVIDER_ENV_ALIASES[provider] ?? [];
    for (const name of aliases) {
        const value = process.env[name]?.trim();
        if (value) return value;
    }
    return null;
}

export async function getServerIntegrationKey(
    userId: string | undefined,
    provider: string,
): Promise<string | null> {
    if (userId) {
        try {
            const admin = createAdminClient();
            const { data } = await admin
                .from('user_integration_keys')
                .select('api_key')
                .eq('user_id', userId)
                .eq('provider', provider)
                .maybeSingle();
            const key = (data as { api_key?: string } | null)?.api_key?.trim();
            if (key) return key;
        } catch {
            // Fall through to server environment keys.
        }
    }

    return getProviderEnvKey(provider);
}
