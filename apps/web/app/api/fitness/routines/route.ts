import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

// fitness_workout_routines has no tracked migration and does not exist in the
// deployed schema, so routines are reported as unavailable until it does.
const ROUTINES_UNAVAILABLE = {
    error: 'Workout routines are not available yet.',
};

export async function GET() {
    const { supabase } = await createClients();
    try {
        await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ routines: [] });
}

export async function POST() {
    const { supabase } = await createClients();
    try {
        await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(ROUTINES_UNAVAILABLE, { status: 503 });
}
