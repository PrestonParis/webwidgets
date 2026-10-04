import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/objectives/[id]/policy-decisions/route';
import { PolicyPersistenceError } from '@/app/api/objectives/[id]/policy-decisions/_lib/schemas';

const mocks = vi.hoisted(() => ({
    createClients: vi.fn(),
    getRequestUserId: vi.fn(),
    loadPolicyAuthority: vi.fn(),
    evaluateAutomationPolicy: vi.fn(),
    persistPolicyDecision: vi.fn(),
}));

vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: mocks.createClients,
}));
vi.mock('@/features/backend/lib/requestUser', () => ({
    getRequestUserId: mocks.getRequestUserId,
}));
vi.mock('@/lib/automationPolicy', () => ({
    evaluateAutomationPolicy: mocks.evaluateAutomationPolicy,
}));
vi.mock('@/app/api/objectives/[id]/policy-decisions/_lib/authority', () => ({
    loadPolicyAuthority: mocks.loadPolicyAuthority,
}));
vi.mock('@/app/api/objectives/[id]/policy-decisions/_lib/persistence', () => ({
    persistPolicyDecision: mocks.persistPolicyDecision,
}));

const objectiveId = '11111111-1111-4111-8111-111111111111';
const body = {
    contractVersion: '2.0',
    planId: '22222222-2222-4222-8222-222222222222',
    stepId: '33333333-3333-4333-8333-333333333333',
};

function request(input: unknown = body) {
    return new Request(
        `http://localhost/api/objectives/${objectiveId}/policy-decisions`,
        {
            method: 'POST',
            body: JSON.stringify(input),
        },
    );
}

async function invoke(input?: unknown) {
    return POST(request(input), {
        params: Promise.resolve({ id: objectiveId }),
    });
}

describe('V2 policy persistence route', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.createClients.mockResolvedValue({
            supabase: {},
            supabaseAdmin: {},
        });
        mocks.getRequestUserId.mockResolvedValue(
            '44444444-4444-4444-8444-444444444444',
        );
        mocks.loadPolicyAuthority.mockResolvedValue({
            request: {},
            persistence: {},
        });
        mocks.evaluateAutomationPolicy.mockResolvedValue({ id: 'decision' });
    });

    it('rejects client-supplied policy authority', async () => {
        const response = await invoke({ ...body, decision: 'allow' });
        expect(response.status).toBe(400);
        expect(mocks.createClients).not.toHaveBeenCalled();
    });

    it('returns a newly created exact approval', async () => {
        mocks.persistPolicyDecision.mockResolvedValue({
            policyDecision: { id: 'decision' },
            approval: { id: 'approval', status: 'pending' },
            reused: false,
        });
        const response = await invoke();
        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toMatchObject({
            approval: { status: 'pending' },
            reused: false,
        });
        expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
            {},
            { id: 'decision' },
            {},
        );
    });

    it('returns 200 for an atomically reused decision', async () => {
        mocks.persistPolicyDecision.mockResolvedValue({
            policyDecision: { id: 'decision' },
            approval: null,
            reused: true,
        });
        expect((await invoke()).status).toBe(200);
    });

    it('does not reveal a cross-owner target', async () => {
        mocks.loadPolicyAuthority.mockRejectedValue(
            new PolicyPersistenceError('policy_target_not_found', 404),
        );
        const response = await invoke();
        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual({
            error: 'policy_target_not_found',
        });
        expect(mocks.evaluateAutomationPolicy).not.toHaveBeenCalled();
    });
});
