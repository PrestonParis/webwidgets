import assert from 'node:assert/strict';
import { afterEach, it } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { workerEnvSchema } from '../env.js';
import {
    getValidGoogleToken,
    getValidMicrosoftToken,
} from '../lib/tokenRefresh.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = originalFetch;
});

function requestUrl(input: string | URL | Request) {
    return input instanceof Request ? input.url : input.toString();
}

function bodyText(input: unknown) {
    assert.equal(typeof input, 'string');
    return input as string;
}

function fixture() {
    return {
        client: createClient('https://fixture.supabase.co', 'fixture-role', {
            auth: { persistSession: false, autoRefreshToken: false },
        }),
        env: workerEnvSchema.parse({
            SUPABASE_URL: 'https://fixture.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'fixture-role',
            REDIS_URL: 'redis://localhost:6379',
            WEB_APP_URL: 'https://app.invalid',
            WORKER_API_TOKEN: 'fixture-worker-token-at-least-32-characters',
            MICROSOFT_CLIENT_ID: 'fixture-client',
            MICROSOFT_CLIENT_SECRET: 'fixture-secret',
            GOOGLE_CLIENT_ID: 'fixture-client',
            GOOGLE_CLIENT_SECRET: 'fixture-secret',
        }),
        userId: 'fixture-user',
        accountId: 'fixture-account',
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        expiresAt: 1,
    };
}

void it('Microsoft refresh retains original grant and persists rotated refresh token scoped to owner/account', async () => {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    globalThis.fetch = (url, init) => {
        calls.push({ url: requestUrl(url), init });
        if (requestUrl(url).includes('/token'))
            return Promise.resolve(
                Response.json({
                    access_token: 'new-access',
                    refresh_token: 'rotated-refresh',
                    expires_in: 3600,
                }),
            );
        return Promise.resolve(new Response(null, { status: 204 }));
    };
    assert.equal(await getValidMicrosoftToken(fixture()), 'new-access');
    assert.equal(
        new URLSearchParams(bodyText(calls[0]?.init?.body)).has('scope'),
        false,
    );
    const update = calls.at(1);
    assert.ok(update);
    const url = new URL(update.url);
    assert.equal(url.searchParams.get('id'), 'eq.fixture-account');
    assert.equal(url.searchParams.get('user_id'), 'eq.fixture-user');
    const body = JSON.parse(bodyText(update.init?.body)) as Record<
        string,
        unknown
    >;
    assert.equal(body.refresh_token, 'rotated-refresh');
    assert.equal(body.access_token, 'new-access');
    assert.equal('granted_scopes' in body, false);
});

void it('Google refresh preserves existing refresh token when provider omits replacement', async () => {
    let update: Record<string, unknown> = {};
    globalThis.fetch = (url, init) => {
        if (requestUrl(url).includes('googleapis'))
            return Promise.resolve(
                Response.json({
                    access_token: 'new-google',
                    expires_in: 3600,
                }),
            );
        update = JSON.parse(bodyText(init?.body)) as Record<string, unknown>;
        return Promise.resolve(new Response(null, { status: 204 }));
    };
    assert.equal(await getValidGoogleToken(fixture()), 'new-google');
    assert.equal('refresh_token' in update, false);
});

void it('revoked consent never writes credentials or exposes provider response', async () => {
    let calls = 0;
    globalThis.fetch = () => {
        calls++;
        return Promise.resolve(
            Response.json(
                {
                    error: 'invalid_grant',
                    error_description: 'fixture-private-value',
                },
                { status: 400 },
            ),
        );
    };
    await assert.rejects(getValidMicrosoftToken(fixture()), {
        message: 'Microsoft token refresh failed',
    });
    assert.equal(calls, 1);
});

void it('unexpired token avoids refresh', async () => {
    globalThis.fetch = () => Promise.reject(new Error('unexpected network'));
    assert.equal(
        await getValidMicrosoftToken({
            ...fixture(),
            expiresAt: Date.now() + 3600000,
        }),
        'old-access',
    );
});
