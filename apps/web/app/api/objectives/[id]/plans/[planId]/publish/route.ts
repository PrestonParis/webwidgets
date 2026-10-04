import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    PlanGraphValidationError,
    validatePlanGraph,
} from '@/lib/automationPlanning';
import { productionCapabilityRegistry } from '@/lib/capabilityRegistry/productionRegistry';
import { createClients } from '@/lib/supabase/serverClient';
import { loadPlanGraph } from './_lib/loadPlanGraph';
import {
    PlanPublicationError,
    publishPlanBodySchema,
    publishPlanResultSchema,
} from './_lib/schemas';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; planId: string }> },
) {
    try {
        const params = await context.params;
        const objectiveId = z.string().uuid().parse(params.id);
        const planId = z.string().uuid().parse(params.planId);
        const input = publishPlanBodySchema.parse(
            await request.json().catch(() => null),
        );
        const { supabase, supabaseAdmin } = await createClients();
        const userId = await getRequestUserId(supabase);
        const graph = await loadPlanGraph(
            supabaseAdmin,
            userId,
            objectiveId,
            planId,
        );
        if (graph.plan.graphHash !== input.expectedGraphHash) {
            throw new PlanPublicationError('plan_graph_hash_conflict', 409);
        }
        if (graph.plan.status === 'draft') {
            await validatePlanGraph(graph, productionCapabilityRegistry);
        }
        const publication = await supabaseAdmin.rpc(
            'publish_v2_objective_plan',
            {
                p_plan_id: planId,
                p_user_id: userId,
                p_expected_graph_hash: input.expectedGraphHash,
            },
        );
        if (publication.error) {
            throw new PlanPublicationError('plan_publication_conflict', 409);
        }
        const result = publishPlanResultSchema.safeParse(publication.data);
        if (!result.success) {
            throw new PlanPublicationError(
                'plan_publication_result_invalid',
                500,
            );
        }
        return NextResponse.json(result.data, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        if (error instanceof PlanPublicationError) {
            return NextResponse.json(
                { error: error.code },
                { status: error.status },
            );
        }
        if (error instanceof PlanGraphValidationError) {
            return NextResponse.json({ error: error.code }, { status: 409 });
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'invalid_plan_publication' },
                { status: 400 },
            );
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { error: 'plan_publication_failed' },
            { status: 500 },
        );
    }
}
