import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { createCallbackSession } from '@/app/api/auth/_lib/callbackSession';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('OAuth callback session persistence', () => {
    it.each([1, 8000])(
        'does not publish provider credentials of length %i into browser cookies',
        async (length) => {
            vi.stubEnv(
                'NEXT_PUBLIC_SUPABASE_URL',
                'https://fixture.supabase.co',
            );
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fixture-anon');
            const user = {
                id: '91111111-1111-4111-8111-111111111111',
                aud: 'authenticated',
                role: 'authenticated',
            };
            const jwt =
                [
                    { alg: 'HS256', typ: 'JWT' },
                    { exp: Math.floor(Date.now() / 1000) + 3600, sub: user.id },
                ]
                    .map((part) =>
                        Buffer.from(JSON.stringify(part)).toString('base64url'),
                    )
                    .join('.') + '.fixture';
            vi.stubGlobal(
                'fetch',
                vi.fn((url: string) => {
                    if (url.includes('/token?'))
                        return Promise.resolve(
                            Response.json({
                                access_token: jwt,
                                refresh_token: 'supabase-refresh',
                                expires_in: 3600,
                                token_type: 'bearer',
                                user,
                                provider_token: 'PRIVATE-PROVIDER-TOKEN'.repeat(
                                    length,
                                ),
                                provider_refresh_token:
                                    'PRIVATE-PROVIDER-REFRESH',
                            }),
                        );
                    return Promise.resolve(Response.json(user));
                }),
            );
            const verifier =
                'base64-' +
                Buffer.from(JSON.stringify('fixture-verifier')).toString(
                    'base64url',
                );
            const callback = createCallbackSession(
                new Request('https://app.invalid/auth/callback', {
                    headers: {
                        cookie: `sb-fixture-auth-token-code-verifier=${encodeURIComponent(verifier)}`,
                    },
                }),
            );
            const exchange =
                await callback.client.auth.exchangeCodeForSession(
                    'fixture-code',
                );
            expect(exchange.error).toBeNull();
            expect(exchange.data.session?.provider_token).toBe(
                'PRIVATE-PROVIDER-TOKEN'.repeat(length),
            );
            const response = NextResponse.redirect('https://app.invalid/');
            expect(response.cookies.getAll()).toEqual([]);
            await callback.writeSanitizedSession(
                response,
                exchange.data.session!,
            );
            const value = response.cookies
                .getAll()
                .filter(
                    (cookie) =>
                        cookie.name.startsWith('sb-fixture-auth-token') &&
                        !cookie.name.includes('verifier'),
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cookie) => cookie.value)
                .join('');
            const decoded = Buffer.from(
                value.replace(/^base64-/, ''),
                'base64url',
            ).toString();
            expect(decoded).toContain('supabase-refresh');
            expect(decoded).not.toContain('PRIVATE-PROVIDER');
            expect(decoded).not.toContain('provider_token');
        },
    );
    it('constructs without cookies and rejects exchange without PKCE proof', async () => {
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fixture-anon');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const callback = createCallbackSession({ headers: new Headers() });
        const exchange =
            await callback.client.auth.exchangeCodeForSession('fixture-code');
        expect(exchange.error?.code).toBe('pkce_code_verifier_not_found');
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it('reports missing server configuration without exposing its values', () => {
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'PRIVATE-FIXTURE-KEY');
        expect(() => createCallbackSession({ headers: new Headers() })).toThrow(
            'supabase_callback_configuration_missing',
        );
    });
});
