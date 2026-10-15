import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyGoogleAccount } from '@/app/api/auth/_lib/googleOAuth';
import { exchangeMicrosoftCode } from '@/app/api/auth/_lib/microsoftOAuth';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

const googleInfo = {
    email: 'TEST@example.invalid',
    sub: 'account-one',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    expires_in: '3600',
    aud: 'client-one',
    email_verified: 'true',
};

describe('verified Google credentials', () => {
    it('uses verified identity and actual scopes', async () => {
        vi.stubEnv('GOOGLE_CLIENT_ID', 'client-one');
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(Response.json(googleInfo)),
        );
        const account = await verifyGoogleAccount('fixture-token');
        expect(account.email).toBe('test@example.invalid');
        expect(account.subject).toBe('account-one');
        expect(account.scopes).toEqual(['gmail.readonly']);
    });
    it.each([
        { aud: 'other-client' },
        { email_verified: 'false' },
        { scope: '' },
        { sub: '' },
    ])('fails closed for invalid identity/grants %j', async (changes) => {
        vi.stubEnv('GOOGLE_CLIENT_ID', 'client-one');
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    Response.json({ ...googleInfo, ...changes }),
                ),
        );
        await expect(verifyGoogleAccount('fixture-token')).rejects.toThrow();
    });
    it('does not assume scopes when token verification is unavailable', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response('', { status: 503 })),
        );
        await expect(verifyGoogleAccount('fixture-token')).rejects.toThrow(
            'google_identity_verification_failed',
        );
    });
});

describe('Microsoft code exchange', () => {
    it('sends PKCE verifier and records verified identity without sending mail', async () => {
        vi.stubEnv('MICROSOFT_CLIENT_ID', 'client');
        vi.stubEnv('MICROSOFT_CLIENT_SECRET', 'fixture-secret');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                Response.json({
                    access_token: 'fixture-token',
                    refresh_token: 'fixture-refresh',
                    expires_in: 3600,
                    scope: 'Mail.Read User.Read',
                }),
            )
            .mockResolvedValueOnce(
                Response.json({ id: 'ms-account', mail: 'ms@example.invalid' }),
            );
        vi.stubGlobal('fetch', fetchMock);
        const account = await exchangeMicrosoftCode(
            new Request('https://app.invalid/callback'),
            'fixture-code',
            'fixture-verifier',
        );
        expect(account.scopes).toEqual(['Mail.Read', 'User.Read']);
        const first = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect((first.body as URLSearchParams).get('code_verifier')).toBe(
            'fixture-verifier',
        );
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/me?$select=');
    });
    it('rejects an OAuth grant missing mail permission before account persistence', async () => {
        vi.stubEnv('MICROSOFT_CLIENT_ID', 'client');
        vi.stubEnv('MICROSOFT_CLIENT_SECRET', 'fixture-secret');
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    Response.json({
                        access_token: 'fixture-token',
                        expires_in: 3600,
                        scope: 'User.Read',
                    }),
                ),
        );
        await expect(
            exchangeMicrosoftCode(
                new Request('https://app.invalid/callback'),
                'fixture-code',
                'verifier',
            ),
        ).rejects.toThrow('microsoft_mail_scope_missing');
    });
});
