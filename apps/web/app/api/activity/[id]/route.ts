import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    markEventsRead,
    markEventsUnread,
    archiveEvents,
    unarchiveEvents,
    getActivityEvent,
} from '@/features/activity/services/activityService';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/activity/[id]
// Body: { action: 'read' | 'unread' | 'archive' | 'unarchive' }
export async function PATCH(
    req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as { action?: string };
        const action = body.action;

        if (!action) {
            return NextResponse.json(
                { error: 'MISSING_FIELD', required: ['action'] },
                { status: 400 },
            );
        }

        switch (action) {
            case 'read':
                await markEventsRead(supabase, userId, [id]);
                break;
            case 'unread':
                await markEventsUnread(supabase, userId, [id]);
                break;
            case 'archive':
                await archiveEvents(supabase, userId, [id]);
                break;
            case 'unarchive':
                await unarchiveEvents(supabase, userId, [id]);
                break;
            default:
                return NextResponse.json(
                    {
                        error: 'INVALID_ACTION',
                        valid: ['read', 'unread', 'archive', 'unarchive'],
                    },
                    { status: 400 },
                );
        }

        const updated = await getActivityEvent(supabase, userId, id);
        return NextResponse.json({ event: updated });
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
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
