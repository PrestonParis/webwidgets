import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { listActivityEventsForUser } from '@/features/activity/services/activityService';

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        events: await listActivityEventsForUser(supabase, userId),
    });
}
