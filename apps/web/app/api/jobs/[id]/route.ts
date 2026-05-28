import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getJob } from '@/features/jobs/services/jobService';

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    const job = await getJob(supabase, userId, id);
    return job
        ? NextResponse.json(job)
        : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
