import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { getJob } from '@/features/jobs/services/jobService';
import { getRunnerForJob } from '@/features/jobs/services/jobRunner';

// Register all runners before looking up a runner
import '@/features/jobs/lib/jobRunners';

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const job = await getJob(supabase, userId, id);
        if (!job) {
            return NextResponse.json(
                { error: 'JOB_NOT_FOUND' },
                { status: 404 },
            );
        }

        if (job.status !== 'queued' && job.status !== 'failed') {
            return NextResponse.json(
                { error: 'JOB_NOT_RUNNABLE', status: job.status },
                { status: 409 },
            );
        }

        const runner = getRunnerForJob(job);
        if (!runner) {
            return NextResponse.json(
                { error: 'NO_RUNNER_FOR_JOB_TYPE', type: job.type },
                { status: 400 },
            );
        }

        // Run synchronously — fine for Stage 1 job sizes.
        // Switch to async queue when job execution time exceeds ~25s.
        await runner.run(job, supabase, supabaseAdmin);

        return NextResponse.json({ success: true, jobId: id });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json(
                { error: 'TABLE_NOT_FOUND' },
                { status: 503 },
            );
        const reason = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { error: 'JOB_FAILED', reason },
            { status: 500 },
        );
    }
}
