import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/objectives/[id]/plans/[planId]/publish/route';
import { PlanPublicationError } from '@/app/api/objectives/[id]/plans/[planId]/publish/_lib/schemas';

const mocks = vi.hoisted(() => ({
    createClients: vi.fn(),
    getRequestUserId: vi.fn(),
    loadPlanGraph: vi.fn(),
    validatePlanGraph: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: mocks.createClients,
}));
vi.mock('@/features/backend/lib/requestUser', () => ({
    getRequestUserId: mocks.getRequestUserId,
}));
vi.mock('@/lib/automationPlanning', async (importOriginal) => {
    const original = await importOriginal<object>();
    return { ...original, validatePlanGraph: mocks.validatePlanGraph };
});
vi.mock(
    '@/app/api/objectives/[id]/plans/[planId]/publish/_lib/loadPlanGraph',
    () => ({ loadPlanGraph: mocks.loadPlanGraph }),
);

const objectiveId = '11111111-1111-4111-8111-111111111111';
const planId = '22222222-2222-4222-8222-222222222222';
const graphHash = 'a'.repeat(64);

function request(body: unknown) {
    return new Request(
        `http://localhost/api/objectives/${objectiveId}/plans/${planId}/publish`,
        { method: 'POST', body: JSON.stringify(body) },
    );
}

async function invoke(
    body: unknown = {
        contractVersion: '2.0',
        expectedGraphHash: graphHash,
    },
) {
    return POST(request(body), {
        params: Promise.resolve({ id: objectiveId, planId }),
    });
}

describe('V2 plan publication route', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.rpc.mockResolvedValue({
            data: {
                planId,
                status: 'published',
                publishedAt: '2026-09-21T12:00:00.000Z',
                reused: false,
            },
            error: null,
        });
        mocks.createClients.mockResolvedValue({
            supabase: {},
            supabaseAdmin: { rpc: mocks.rpc },
        });
        mocks.getRequestUserId.mockResolvedValue(
            '33333333-3333-4333-8333-333333333333',
        );
        mocks.loadPlanGraph.mockResolvedValue({
            plan: { status: 'draft', graphHash },
        });
        mocks.validatePlanGraph.mockResolvedValue({ graphHash });
    });

    it('rejects caller-supplied graph content', async () => {
        const response = await invoke({
            contractVersion: '2.0',
            expectedGraphHash: graphHash,
            steps: [],
        });
        expect(response.status).toBe(400);
        expect(mocks.createClients).not.toHaveBeenCalled();
    });

    it('rejects malformed JSON as an invalid publication request', async () => {
        const response = await POST(
            new Request(
                `http://localhost/api/objectives/${objectiveId}/plans/${planId}/publish`,
                { method: 'POST', body: '{' },
            ),
            { params: Promise.resolve({ id: objectiveId, planId }) },
        );
        expect(response.status).toBe(400);
        expect(mocks.createClients).not.toHaveBeenCalled();
    });

    it('validates the server-loaded graph before atomic publication', async () => {
        const response = await invoke();
        expect(response.status).toBe(200);
        expect(mocks.validatePlanGraph).toHaveBeenCalledOnce();
        expect(mocks.rpc).toHaveBeenCalledWith(
            'publish_v2_objective_plan',
            expect.objectContaining({
                p_plan_id: planId,
                p_expected_graph_hash: graphHash,
            }),
        );
    });

    it('reuses an already-published plan with the exact hash', async () => {
        mocks.loadPlanGraph.mockResolvedValue({
            plan: { status: 'published', graphHash },
        });
        mocks.rpc.mockResolvedValue({
            data: {
                planId,
                status: 'published',
                publishedAt: '2026-09-21T12:00:00.000Z',
                reused: true,
            },
            error: null,
        });
        const response = await invoke();
        expect(response.status).toBe(200);
        expect(mocks.validatePlanGraph).not.toHaveBeenCalled();
        await expect(response.json()).resolves.toMatchObject({ reused: true });
    });

    it('treats malformed database output as a server failure', async () => {
        mocks.rpc.mockResolvedValue({
            data: { status: 'published' },
            error: null,
        });
        const response = await invoke();
        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: 'plan_publication_result_invalid',
        });
    });

    it('does not reveal a cross-owner plan', async () => {
        mocks.loadPlanGraph.mockRejectedValue(
            new PlanPublicationError('plan_not_found', 404),
        );
        const response = await invoke();
        expect(response.status).toBe(404);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });
});
