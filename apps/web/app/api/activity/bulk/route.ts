import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    markEventsRead,
    markEventsUnread,
    archiveEvents,
    unarchiveEvents,
} from '@/features/activity/services/activityService';

type BulkAction =
    | { action: 'read-all' }
    | { action: 'mark-read'; ids: string[] }
    | { action: 'mark-unread'; ids: string[] }
    | { action: 'archive'; ids: string[] }
    | { action: 'unarchive'; ids: string[] };

// POST /api/activity/bulk
// Body: { action: 'read-all' | 'mark-read' | 'mark-unread' | 'archive' | 'unarchive', ids?: string[] }
export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = (await req.json()) as BulkAction;

        if (!body.action) {
            return NextResponse.json(
                { error: 'MISSING_ACTION' },
                { status: 400 },
            );
        }

        if (body.action === 'read-all') {
            const { error } = await supabase
                .from('activity_events')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('is_archived', false)
                .is('read_at', null);
            if (error) throw error;
            return NextResponse.json({ ok: true, action: 'read-all' });
        }

        // All remaining actions need an ids array
        const ids = 'ids' in body ? body.ids : [];
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'IDS_REQUIRED' },
                { status: 400 },
            );
        }
        // Limit to prevent abuse
        if (ids.length > 200) {
            return NextResponse.json(
                { error: 'TOO_MANY_IDS', max: 200 },
                { status: 400 },
            );
        }

        switch (body.action) {
            case 'mark-read':
                await markEventsRead(supabase, userId, ids);
                break;
            case 'mark-unread':
                await markEventsUnread(supabase, userId, ids);
                break;
            case 'archive':
                await archiveEvents(supabase, userId, ids);
                break;
            case 'unarchive':
                await unarchiveEvents(supabase, userId, ids);
                break;
            default:
                return NextResponse.json(
                    {
                        error: 'INVALID_ACTION',
                        valid: [
                            'read-all',
                            'mark-read',
                            'mark-unread',
                            'archive',
                            'unarchive',
                        ],
                    },
                    { status: 400 },
                );
        }

        return NextResponse.json({
            ok: true,
            action: body.action,
            affected: ids.length,
        });
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
