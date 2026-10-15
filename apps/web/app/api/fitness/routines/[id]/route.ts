import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

// See ../route.ts: the routines table does not exist in the deployed schema.
const ROUTINES_UNAVAILABLE = {
    error: 'Workout routines are not available yet.',
};

export async function DELETE() {
    const { supabase } = await createClients();
    try {
        await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(ROUTINES_UNAVAILABLE, { status: 503 });
}
