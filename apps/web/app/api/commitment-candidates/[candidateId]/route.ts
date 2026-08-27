import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { reviewCommitmentCandidate } from '@/lib/commitments/review';
import { createTypedClients } from '@/lib/supabase/serverClient';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ candidateId: string }> },
) {
    try {
        const { supabase, supabaseAdmin } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const candidateId = z
            .string()
            .uuid()
            .parse((await context.params).candidateId);
        const result = await reviewCommitmentCandidate(
            supabase,
            candidateId,
            await request.json().catch(() => null),
        );
        await supabaseAdmin.from('analytics_events').insert({
            user_id: userId,
            type: `commitment_candidate_${result.state}`,
            source: 'commitment_candidates',
            metadata: { candidateId },
        });
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const status =
            message === 'Unauthorized'
                ? 401
                : message.includes('conflict')
                  ? 409
                  : error instanceof ZodError || message.includes('invalid')
                    ? 400
                    : 500;
        return NextResponse.json(
            { error: 'candidate_review_failed' },
            { status },
        );
    }
}
