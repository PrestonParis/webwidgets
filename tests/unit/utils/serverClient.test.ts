import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(
        (_url: string, _key: string, _options: unknown) => ({ kind: 'admin' }),
    ),
    createServerClient: vi.fn(
        (_url: string, _key: string, _options: unknown) => ({
            kind: 'session',
        }),
    ),
    cookies: vi.fn(() =>
        Promise.resolve({ getAll: vi.fn(), set: vi.fn() }),
    ),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: mocks.createClient,
}));
vi.mock('@supabase/ssr', () => ({
    createServerClient: mocks.createServerClient,
}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));

import { createTypedClients } from '@/lib/supabase/serverClient';

describe('server Supabase clients', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    });

    it('keeps the service-role client independent from user cookies', async () => {
        const clients = await createTypedClients();

        expect(clients).toEqual({
            supabase: { kind: 'session' },
            supabaseAdmin: { kind: 'admin' },
        });
        const sessionCall = mocks.createServerClient.mock.calls[0];
        const options = sessionCall?.[2] as
            | {
                  cookies?: { getAll?: unknown; setAll?: unknown };
              }
            | undefined;
        expect(sessionCall?.[0]).toBe('https://project.supabase.co');
        expect(sessionCall?.[1]).toBe('anon-key');
        expect(typeof options?.cookies?.getAll).toBe('function');
        expect(typeof options?.cookies?.setAll).toBe('function');
        expect(mocks.createClient).toHaveBeenCalledWith(
            'https://project.supabase.co',
            'service-role-key',
            {
                auth: {
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    persistSession: false,
                },
            },
        );
    });
});
