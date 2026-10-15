import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { reviewCommitmentCandidate } from '@/lib/commitments/review';
import { createTypedClients } from '@/lib/supabase/serverClient';
import { materializeAndEnqueueTaskAction } from '@/lib/taskActions/orchestration';

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
        const candidate = await supabase
            .from('candidate_actions')
            .select('candidate_kind')
            .eq('id', candidateId)
            .eq('user_id', userId)
            .single();
        if (candidate.error) throw new Error('candidate_read_failed');
        const execution =
            result.state === 'approved' &&
            candidate.data.candidate_kind === 'task'
                ? await materializeAndEnqueueTaskAction({
                      db: supabase,
                      userId,
                      candidateId,
                      expectedVersion: result.expectedVersion,
                      expectedHash: result.expectedHash,
                  })
                : null;
        await supabaseAdmin.from('analytics_events').insert({
            user_id: userId,
            type: `commitment_candidate_${result.state}`,
            source: 'commitment_candidates',
            metadata: { candidateId },
        });
        return NextResponse.json({ ...result, execution });
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
