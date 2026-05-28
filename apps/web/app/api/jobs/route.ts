import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Json } from '@/types/supabase';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createJob, listJobs } from '@/features/jobs/services/jobService';

const createJobSchema = z.object({
    type: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({ jobs: await listJobs(supabase, userId) });
}

export async function POST(req: Request) {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    const parsed = createJobSchema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    return NextResponse.json(
        await createJob(
            supabase,
            userId,
            parsed.data.type as never,
            (parsed.data.metadata ?? {}) as Json,
        ),
    );
}
