import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import {
    upsertSnapshots,
    markAccountSynced,
    type EmailAccount,
} from '../lib/supabase.js';
import {
    getValidGoogleToken,
    getValidMicrosoftToken,
} from '../lib/tokenRefresh.js';
import { fetchGmailSnapshots } from '../lib/gmailFetch.js';
import { fetchOutlookSnapshots } from '../lib/outlookFetch.js';

interface SyncDependencies {
    client: SupabaseClient;
    env: WorkerEnv;
}

export async function syncAccount(
    account: EmailAccount,
    dependencies: SyncDependencies,
): Promise<{ synced: number }> {
    const tokenInput = {
        client: dependencies.client,
        env: dependencies.env,
        userId: account.user_id,
        accountId: account.id,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
    };
    const token =
        account.provider === 'google'
            ? await getValidGoogleToken(tokenInput)
            : await getValidMicrosoftToken(tokenInput);
    const snapshots =
        account.provider === 'google'
            ? await fetchGmailSnapshots(
                  account.user_id,
                  account.email,
                  token,
                  dependencies.env.SYNC_BATCH_SIZE,
              )
            : await fetchOutlookSnapshots(
                  account.user_id,
                  account.email,
                  token,
                  dependencies.env.SYNC_BATCH_SIZE,
              );
    await upsertSnapshots(dependencies.client, snapshots);
    await markAccountSynced(dependencies.client, account.user_id, account.id);
    return { synced: snapshots.length };
}
