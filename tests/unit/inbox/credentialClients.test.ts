import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    clients: vi.fn(),
    user: vi.fn(),
    admin: vi.fn(),
}));
vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: mocks.clients,
}));
vi.mock('@/lib/supabase/getUser', () => ({ getUserOrThrow: mocks.user }));
vi.mock('@/lib/supabase/adminClient', () => ({
    createAdminClient: mocks.admin,
}));
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';

beforeEach(() => {
    vi.resetAllMocks();
    mocks.clients.mockResolvedValue({
        supabase: 'user-client',
        supabaseAdmin: 'cookie-client',
    });
    mocks.user.mockResolvedValue({ id: 'owner' });
    mocks.admin.mockReturnValue('server-only-client');
});

describe('credential server boundary', () => {
    it('uses cookie-free service client only after verified user lookup', async () => {
        expect(await createCredentialClients('owner')).toEqual({
            supabase: 'user-client',
            supabaseAdmin: 'server-only-client',
            userId: 'owner',
        });
        expect(mocks.user).toHaveBeenCalledWith('user-client');
        expect(mocks.user.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.admin.mock.invocationCallOrder[0]!,
        );
    });
    it('rejects mismatched resolver ownership before admin creation', async () => {
        await expect(createCredentialClients('someone-else')).rejects.toThrow(
            'Unauthorized',
        );
        expect(mocks.admin).not.toHaveBeenCalled();
    });
    it('rejects unauthenticated callers before admin creation', async () => {
        mocks.user.mockRejectedValue(new Error('Unauthorized'));
        await expect(createCredentialClients()).rejects.toThrow('Unauthorized');
        expect(mocks.admin).not.toHaveBeenCalled();
    });
});
