import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { cancelJob } from '@/features/jobs/services/jobService';

export async function POST(
    _: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json(await cancelJob(supabase, userId, id));
}
