import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { markAllRead } from '@/features/notifications/services/notificationService';

export async function POST(): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        await markAllRead(supabase, userId);
        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({ success: true }); // graceful
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
