import { env } from '../env.js';
import { updateAccountTokens } from './supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MS_TOKEN_URL = `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

// Returns a valid access token, refreshing if within 5 minutes of expiry.
export async function getValidGoogleToken(
    accountId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: number | null,
): Promise<string> {
    const needsRefresh = !expiresAt || Date.now() > expiresAt - 5 * 60 * 1000;
    if (!needsRefresh) return accessToken;
    if (!refreshToken)
        throw new Error(`No refresh token for account ${accountId}`);

    const body = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        error?: string;
    };
    if (json.error || !json.access_token) {
        throw new Error(
            `Google token refresh failed: ${json.error ?? 'unknown'}`,
        );
    }

    const newExpiresAt = Date.now() + (json.expires_in ?? 3590) * 1000;
    await updateAccountTokens(accountId, json.access_token, newExpiresAt);
    return json.access_token;
}

export async function getValidMicrosoftToken(
    accountId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: number | null,
): Promise<string> {
    const needsRefresh = !expiresAt || Date.now() > expiresAt - 5 * 60 * 1000;
    if (!needsRefresh) return accessToken;
    if (!refreshToken)
        throw new Error(`No refresh token for account ${accountId}`);

    const body = new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID,
        client_secret: env.MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read offline_access',
    });

    const res = await fetch(MS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        error?: string;
    };
    if (json.error || !json.access_token) {
        throw new Error(
            `Microsoft token refresh failed: ${json.error ?? 'unknown'}`,
        );
    }

    const newExpiresAt = Date.now() + (json.expires_in ?? 3590) * 1000;
    await updateAccountTokens(accountId, json.access_token, newExpiresAt);
    return json.access_token;
}
