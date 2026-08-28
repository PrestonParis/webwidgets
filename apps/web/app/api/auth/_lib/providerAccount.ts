import { createAdminClient } from '@/lib/supabase/adminClient';

interface VerifiedAccount {
    accessToken: string;
    refreshToken?: string | undefined;
    expiresAt: number;
    scopes: string[];
    email: string;
    subject: string;
}

export async function persistProviderAccount(
    userId: string,
    provider: 'google' | 'microsoft',
    account: VerifiedAccount,
) {
    const result = await createAdminClient().rpc(
        'store_verified_provider_credentials',
        {
            p_user_id: userId,
            p_provider: provider,
            p_email: account.email,
            p_subject: account.subject,
            p_scopes: account.scopes,
            p_access_token: account.accessToken,
            p_refresh_token: account.refreshToken ?? null,
            p_expires_at: account.expiresAt,
        },
    );
    if (result.error) throw new Error('provider_credential_persistence_failed');
}
