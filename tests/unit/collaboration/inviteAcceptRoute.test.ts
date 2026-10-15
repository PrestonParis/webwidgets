import { beforeEach, describe, expect, it, vi } from 'vitest';

type Result = { data?: unknown; error?: unknown };

const queues: Record<string, Result[]> = {};
const updates: Array<{ table: string; values: unknown }> = [];

function chain(table: string) {
    const next = () => Promise.resolve(queues[table]?.shift() ?? {});
    const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        update: (values: unknown) => {
            updates.push({ table, values });
            return builder;
        },
        insert: () => next(),
        single: () => next(),
        maybeSingle: () => next(),
        then: (resolve: (value: Result) => unknown) => next().then(resolve),
    };
    return builder;
}

vi.mock('@/lib/supabase/adminClient', () => ({
    createAdminClient: () => ({
        from: (table: string) => chain(table),
        auth: {
            admin: {
                getUserById: () =>
                    Promise.resolve({
                        data: { user: { email: 'guest@example.invalid' } },
                    }),
            },
        },
    }),
}));

vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: () => Promise.resolve({ supabase: {} }),
}));

vi.mock('@/features/backend/lib/requestUser', () => ({
    getRequestUserId: () => Promise.resolve('user-two'),
}));

vi.mock('@/features/collaboration/lib/activityLogger', () => ({
    logActivity: vi.fn(),
}));

const pendingInvite = {
    id: 'invite-1',
    workspace_id: 'workspace-1',
    email: 'guest@example.invalid',
    role: 'viewer',
    status: 'pending',
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
};

async function accept() {
    const { POST } =
        await import('@/app/api/collaboration/invites/[token]/accept/route');
    return POST(new Request('https://app.test', { method: 'POST' }), {
        params: Promise.resolve({ token: 'token-1' }),
    });
}

describe('invite accept route', () => {
    beforeEach(() => {
        for (const key of Object.keys(queues)) delete queues[key];
        updates.length = 0;
    });

    it('joins the workspace when the invite is claimed', async () => {
        queues.workspace_invites = [
            { data: pendingInvite },
            { data: { id: 'invite-1' } },
        ];
        queues.workspace_members = [{ data: null }, { error: null }];

        const response = await accept();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ workspaceId: 'workspace-1' });
    });

    it('rejects a concurrent accept that loses the claim', async () => {
        queues.workspace_invites = [{ data: pendingInvite }, { data: null }];
        queues.workspace_members = [{ data: null }];

        const response = await accept();

        expect(response.status).toBe(410);
        expect(queues.workspace_members).toHaveLength(0);
    });

    it('releases the claim when the membership insert fails', async () => {
        queues.workspace_invites = [
            { data: pendingInvite },
            { data: { id: 'invite-1' } },
            { error: null },
        ];
        queues.workspace_members = [
            { data: null },
            { error: { code: '23505' } },
        ];

        const response = await accept();

        expect(response.status).toBe(500);
        expect(updates.at(-1)).toEqual({
            table: 'workspace_invites',
            values: { status: 'pending' },
        });
    });
});
