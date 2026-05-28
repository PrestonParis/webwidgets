import { env } from '../env.js';
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

export interface SyncAccountJobData {
    userId: string;
    accountId: string;
    provider: 'google' | 'microsoft';
    email: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
}

export async function syncAccount(
    account: EmailAccount,
): Promise<{ synced: number }> {
    let snapshots;

    if (account.provider === 'google') {
        const token = await getValidGoogleToken(
            account.id,
            account.access_token,
            account.refresh_token,
            account.expires_at,
        );
        snapshots = await fetchGmailSnapshots(
            account.user_id,
            account.email,
            token,
            env.SYNC_BATCH_SIZE,
        );
    } else {
        const token = await getValidMicrosoftToken(
            account.id,
            account.access_token,
            account.refresh_token,
            account.expires_at,
        );
        snapshots = await fetchOutlookSnapshots(
            account.user_id,
            account.email,
            token,
            env.SYNC_BATCH_SIZE,
        );
    }

    await upsertSnapshots(snapshots);
    await markAccountSynced(account.id);
    return { synced: snapshots.length };
}
