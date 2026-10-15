import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    user: vi.fn(),
    consume: vi.fn(),
    exchangeGoogle: vi.fn(),
    exchangeMicrosoft: vi.fn(),
    verify: vi.fn(),
    persist: vi.fn(),
    sanitize: vi.fn(),
    logError: vi.fn(),
}));
vi.mock('@/lib/observability/logger', () => ({
    getLogger: () => ({ error: mocks.logError }),
}));
vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: () => Promise.resolve({ supabase: {} }),
}));
vi.mock('@/lib/supabase/getUser', () => ({ getUserOrThrow: mocks.user }));
vi.mock('@/app/api/auth/_lib/connectionAttempt', () => ({
    consumeConnectionAttempt: mocks.consume,
}));
vi.mock('@/app/api/auth/_lib/callbackSession', () => ({
    createCallbackSession: () => ({
        client: { auth: { exchangeCodeForSession: mocks.exchangeGoogle } },
        writeSanitizedSession: mocks.sanitize,
    }),
}));
vi.mock('@/app/api/auth/_lib/googleOAuth', () => ({
    verifyGoogleAccount: mocks.verify,
}));
vi.mock('@/app/api/auth/_lib/microsoftOAuth', () => ({
    exchangeMicrosoftCode: mocks.exchangeMicrosoft,
}));
vi.mock('@/app/api/auth/_lib/providerAccount', () => ({
    persistProviderAccount: mocks.persist,
}));
import { GET as googleCallback } from '@/app/api/auth/google/callback/route';
import { GET as microsoftCallback } from '@/app/api/auth/microsoft/callback/route';

beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: 'initiating-user' });
    mocks.consume.mockResolvedValue({
        redirectPath: '/inbox',
        verifier: 'pkce-verifier',
    });
    mocks.exchangeGoogle.mockResolvedValue({
        data: {
            session: {
                user: { id: 'provider-auth-user' },
                provider_token: 'fixture-token',
            },
        },
        error: null,
    });
    mocks.verify.mockResolvedValue({
        email: 'me@example.invalid',
        scopes: ['gmail.readonly'],
    });
    mocks.exchangeMicrosoft.mockResolvedValue({
        email: 'me@example.invalid',
        scopes: ['Mail.Read'],
    });
});

describe('OAuth route ownership', () => {
    it('Google ignores attacker uid and preserves initiating app session', async () => {
        const response = await googleCallback(
            new Request(
                'https://app.invalid/auth/callback?ic=1&uid=attacker&code=fixture&state=nonce',
            ),
        );
        expect(response.headers.get('location')).toBe(
            'https://app.invalid/inbox',
        );
        expect(mocks.consume).toHaveBeenCalledWith(
            'initiating-user',
            'google',
            'nonce',
        );
        expect(mocks.persist).toHaveBeenCalledWith(
            'initiating-user',
            'google',
            expect.objectContaining({ scopes: ['gmail.readonly'] }),
        );
        expect(mocks.sanitize).not.toHaveBeenCalled();
    });
    it.each([googleCallback, microsoftCallback])(
        'rejects invalid state before exchanging provider code',
        async (callback) => {
            mocks.consume.mockRejectedValue(
                new Error('oauth_state_expired_or_replayed'),
            );
            const response = await callback(
                new Request(
                    'https://app.invalid/auth/callback?ic=1&code=fixture&state=bad',
                ),
            );
            expect(response.headers.get('location')).toBe(
                'https://app.invalid/auth/auth-code-error',
            );
            expect(mocks.exchangeGoogle).not.toHaveBeenCalled();
            expect(mocks.exchangeMicrosoft).not.toHaveBeenCalled();
            expect(mocks.persist).not.toHaveBeenCalled();
        },
    );
    it('Google inbox connect rejects missing mail grant', async () => {
        mocks.verify.mockResolvedValue({ scopes: ['userinfo.email'] });
        const response = await googleCallback(
            new Request(
                'https://app.invalid/auth/callback?ic=1&code=fixture&state=nonce',
            ),
        );
        expect(response.headers.get('location')).toContain('auth-code-error');
        expect(mocks.persist).not.toHaveBeenCalled();
    });
    it('Google sign-in sanitizes only after successful provider persistence', async () => {
        await googleCallback(
            new Request(
                'https://app.invalid/auth/callback?code=fixture&next=https://attacker.invalid',
            ),
        );
        expect(mocks.persist).toHaveBeenCalledWith(
            'provider-auth-user',
            'google',
            expect.any(Object),
        );
        expect(mocks.sanitize).toHaveBeenCalledOnce();
        expect(mocks.persist.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.sanitize.mock.invocationCallOrder[0]!,
        );
    });
    it('Microsoft passes the consumed PKCE verifier and verified owner', async () => {
        const request = new Request(
            'https://app.invalid/api/auth/microsoft/callback?code=fixture&state=nonce',
        );
        await microsoftCallback(request);
        expect(mocks.exchangeMicrosoft).toHaveBeenCalledWith(
            request,
            'fixture',
            'pkce-verifier',
        );
        expect(mocks.persist).toHaveBeenCalledWith(
            'initiating-user',
            'microsoft',
            expect.any(Object),
        );
    });
    it('does not publish session cookies after persistence failure', async () => {
        mocks.persist.mockRejectedValue(
            new Error('credential_persistence_failed'),
        );
        const response = await googleCallback(
            new Request('https://app.invalid/auth/callback?code=fixture'),
        );
        expect(response.headers.get('location')).toContain('auth-code-error');
        expect(mocks.sanitize).not.toHaveBeenCalled();
    });
    it('reports missing PKCE proof without logging the code or SDK message', async () => {
        mocks.exchangeGoogle.mockResolvedValue({
            data: { session: null },
            error: {
                code: 'pkce_code_verifier_not_found',
                message: 'PRIVATE-VERIFIER',
            },
        });
        const response = await googleCallback(
            new Request('https://app.invalid/auth/callback?code=PRIVATE-CODE'),
        );
        expect(response.headers.get('location')).toBe(
            'https://app.invalid/auth/auth-code-error',
        );
        expect(mocks.logError).toHaveBeenCalledWith(
            { stage: 'code_exchange', reason: 'pkce_code_verifier_not_found' },
            'Google OAuth callback failed',
        );
        expect(mocks.persist).not.toHaveBeenCalled();
        expect(mocks.sanitize).not.toHaveBeenCalled();
    });
    it('reports the failed stage without exposing an unknown error', async () => {
        mocks.verify.mockRejectedValue(new Error('PRIVATE-PROVIDER-TOKEN'));
        await googleCallback(
            new Request('https://app.invalid/auth/callback?code=PRIVATE-CODE'),
        );
        expect(mocks.logError).toHaveBeenCalledWith(
            {
                stage: 'provider_verification',
                reason: 'unclassified_callback_failure',
            },
            'Google OAuth callback failed',
        );
        expect(mocks.persist).not.toHaveBeenCalled();
        expect(mocks.sanitize).not.toHaveBeenCalled();
    });
});
