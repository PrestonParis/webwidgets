import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    begin: vi.fn(),
    signIn: vi.fn(),
    user: vi.fn(),
}));
vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: () =>
        Promise.resolve({
            supabase: { auth: { signInWithOAuth: mocks.signIn } },
        }),
}));
vi.mock('@/lib/supabase/getUser', () => ({
    getUserOrThrow: mocks.user,
}));
vi.mock('@/app/api/auth/_lib/connectionAttempt', () => ({
    beginConnectionAttempt: mocks.begin,
    setConnectionCookie: vi.fn(),
}));

import { GET as googleStart } from '@/app/api/auth/google/start/route';
import { GET as microsoftStart } from '@/app/api/auth/microsoft/start/route';

beforeEach(() => {
    mocks.user.mockRejectedValue(new Error('Unauthorized'));
});

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

it('adds Gmail write scope only for an explicit enabled capability upgrade', async () => {
    mocks.user.mockResolvedValue({ id: 'fixture-user' });
    mocks.begin.mockResolvedValue({ state: 'fixture-state' });
    mocks.signIn.mockResolvedValue({
        data: { url: 'https://accounts.google.invalid/authorize' },
        error: null,
    });
    vi.stubEnv('EMAIL_ACTIONS_ENABLED', 'true');
    await googleStart(
        new Request(
            'https://app.invalid/api/auth/google/start?capability=gmail-compose',
        ),
    );
    const call = mocks.signIn.mock.calls[0]?.[0] as {
        options: { scopes: string };
    };
    expect(call.options.scopes).toContain('/auth/gmail.compose');
    expect(call.options.scopes).not.toContain('/auth/gmail.send');
});

it('keeps Gmail read connections free of write scopes', async () => {
    mocks.user.mockResolvedValue({ id: 'fixture-user' });
    mocks.begin.mockResolvedValue({ state: 'fixture-state' });
    mocks.signIn.mockResolvedValue({
        data: { url: 'https://accounts.google.invalid/authorize' },
        error: null,
    });
    await googleStart(
        new Request(
            'https://app.invalid/api/auth/google/start?capability=gmail',
        ),
    );
    const call = mocks.signIn.mock.calls[0]?.[0] as {
        options: { scopes: string };
    };
    expect(call.options.scopes).not.toContain('/auth/gmail.compose');
    expect(call.options.scopes).not.toContain('/auth/gmail.send');
});

it('adds Outlook write scopes only for the explicit enabled upgrade', async () => {
    mocks.user.mockResolvedValue({ id: 'fixture-user' });
    mocks.begin.mockResolvedValue({
        state: 'fixture-state',
        verifier: 'fixture-verifier',
    });
    vi.stubEnv('MICROSOFT_CLIENT_ID', 'fixture-client');
    vi.stubEnv('EMAIL_ACTIONS_ENABLED', 'true');
    const response = await microsoftStart(
        new Request(
            'https://app.invalid/api/auth/microsoft/start?capability=email-actions',
        ),
    );
    const location = new URL(response.headers.get('location') ?? '');
    const scope = location.searchParams.get('scope') ?? '';
    expect(scope).toContain('Mail.ReadWrite');
    expect(scope).toContain('Mail.Send');
});
