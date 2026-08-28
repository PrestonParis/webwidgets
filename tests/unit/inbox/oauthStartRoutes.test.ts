import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ begin: vi.fn(), signIn: vi.fn() }));
vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: () =>
        Promise.resolve({
            supabase: { auth: { signInWithOAuth: mocks.signIn } },
        }),
}));
vi.mock('@/lib/supabase/getUser', () => ({
    getUserOrThrow: () => Promise.reject(new Error('Unauthorized')),
}));
vi.mock('@/app/api/auth/_lib/connectionAttempt', () => ({
    beginConnectionAttempt: mocks.begin,
    setConnectionCookie: vi.fn(),
}));

import { GET as googleStart } from '@/app/api/auth/google/start/route';
import { GET as microsoftStart } from '@/app/api/auth/microsoft/start/route';

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
});

it.each([googleStart, microsoftStart])(
    'sends signed-out connection requests to the real sign-in screen',
    async (start) => {
        vi.stubEnv('MICROSOFT_CLIENT_ID', 'fixture-client');
        const response = await start(
            new Request(
                'https://app.invalid/api/auth/provider/start?redirect=//attacker.invalid',
            ),
        );
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://app.invalid/');
        expect(mocks.begin).not.toHaveBeenCalled();
        expect(mocks.signIn).not.toHaveBeenCalled();
    },
);
