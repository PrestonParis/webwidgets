import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import { updateAccountTokens } from './supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface RefreshInput {
    client: SupabaseClient;
    env: WorkerEnv;
    userId: string;
    accountId: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
}

function needsRefresh(expiresAt: number | null) {
    return !expiresAt || Date.now() > expiresAt - 5 * 60 * 1000;
}

function requireSecret(value: string | undefined, name: string) {
    if (!value) throw new Error(`${name} is not configured`);
    return value;
}

async function persistToken(
    input: RefreshInput,
    token: string,
    expiresIn: number | undefined,
    refreshToken?: string,
) {
    const expiresAt = Date.now() + (expiresIn ?? 3590) * 1000;
    await updateAccountTokens(
        input.client,
        input.userId,
        input.accountId,
        token,
        expiresAt,
        refreshToken,
    );
    return token;
}

export async function getValidGoogleToken(input: RefreshInput) {
    if (!needsRefresh(input.expiresAt)) return input.accessToken;
    if (!input.refreshToken) throw new Error('Google refresh token missing');
    const body = new URLSearchParams({
        client_id: requireSecret(input.env.GOOGLE_CLIENT_ID, 'Google client'),
        client_secret: requireSecret(
            input.env.GOOGLE_CLIENT_SECRET,
            'Google client secret',
        ),
        refresh_token: input.refreshToken,
        grant_type: 'refresh_token',
    });
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const json = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
    };
    if (!response.ok || !json.access_token) {
        throw new Error('Google token refresh failed');
    }
    return persistToken(input, json.access_token, json.expires_in);
}

export async function getValidMicrosoftToken(input: RefreshInput) {
    if (!needsRefresh(input.expiresAt)) return input.accessToken;
    if (!input.refreshToken) {
        throw new Error('Microsoft refresh token missing');
    }
    const tenant = encodeURIComponent(input.env.MICROSOFT_TENANT_ID);
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: requireSecret(
            input.env.MICROSOFT_CLIENT_ID,
            'Microsoft client',
        ),
        client_secret: requireSecret(
            input.env.MICROSOFT_CLIENT_SECRET,
            'Microsoft client secret',
        ),
        refresh_token: input.refreshToken,
        grant_type: 'refresh_token',
    });
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const json = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
    };
    if (!response.ok || !json.access_token) {
        throw new Error('Microsoft token refresh failed');
    }
    return persistToken(
        input,
        json.access_token,
        json.expires_in,
        json.refresh_token,
    );
}
