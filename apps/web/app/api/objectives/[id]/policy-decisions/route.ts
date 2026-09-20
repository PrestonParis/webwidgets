import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { evaluateAutomationPolicy } from '@/lib/automationPolicy';
import { createClients } from '@/lib/supabase/serverClient';
import { loadPolicyAuthority } from './_lib/authority';
import { persistPolicyDecision } from './_lib/persistence';
import {
    policyEvaluationBodySchema,
    PolicyPersistenceError,
} from './_lib/schemas';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const objectiveId = z
            .string()
            .uuid()
            .parse((await context.params).id);
        const input = policyEvaluationBodySchema.parse(await request.json());
        const { supabase, supabaseAdmin } = await createClients();
        const userId = await getRequestUserId(supabase);
        const authority = await loadPolicyAuthority(
            supabaseAdmin,
            userId,
            objectiveId,
            input.planId,
            input.stepId,
        );
        const decision = await evaluateAutomationPolicy(authority.request);
        const result = await persistPolicyDecision(
            supabaseAdmin,
            decision,
            authority.persistence,
        );
        return NextResponse.json(result, {
            status: result.reused ? 200 : 201,
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        if (error instanceof PolicyPersistenceError) {
            return NextResponse.json(
                { error: error.code },
                { status: error.status },
            );
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'invalid_policy_request' },
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
            { error: 'policy_evaluation_failed' },
            { status: 500 },
        );
    }
}
