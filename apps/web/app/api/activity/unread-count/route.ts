import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { countUnread } from '@/features/activity/lib/activityQueries';

// GET /api/activity/unread-count
// Lightweight endpoint for nav badges and widget counts.
// Returns { count: number } — no event data, minimal payload.
export async function GET(): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const count = await countUnread(supabase, userId);
        return NextResponse.json({ count });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err)) return NextResponse.json({ count: 0 });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
