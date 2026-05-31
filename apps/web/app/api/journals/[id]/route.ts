import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import { ingestJournalContext } from '@/features/context/services/contextProducerService';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH — update an existing journal entry.
// Only publishes an activity event on explicit save, not on every content keystroke.
// (Client must decide when to call this; autosave to localStorage is unaffected.)
export async function PATCH(
    req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as {
            title?: string;
            content?: string;
        };

        const update: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (body.title !== undefined) update.title = body.title.trim();
        if (body.content !== undefined) update.content = body.content;

        const { data, error } = await supabase
            .from('journals')
            .update(update)
            .eq('id', id)
            .eq('user_id', userId)
            .select('id, title, content, type')
            .single();
        if (error) {
            if (isMissingTableError(error))
                return NextResponse.json(
                    { error: 'NOT_FOUND' },
                    { status: 404 },
                );
            throw error;
        }

        const entry = data as {
            id: string;
            title: string;
            content?: string;
            type: string;
        };
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'document',
            eventType: 'journal.updated',
            sourceId: entry.id,
            sourceTable: 'journals',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Journal entry updated: ${entry.title}`,
            metadata: { entryId: entry.id, entryType: entry.type },
        });
        await ingestJournalContext(supabase, userId, {
            id: entry.id,
            title: entry.title,
            content: entry.content,
            type: entry.type,
        });

        return NextResponse.json({ entry: data });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const { data: existing } = await supabase
            .from('journals')
            .select('title')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        const { error } = await supabase
            .from('journals')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;

        const title = (existing as { title?: string } | null)?.title ?? 'Entry';
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'document',
            eventType: 'journal.deleted',
            sourceId: id,
            sourceTable: 'journals',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Journal entry deleted: ${title}`,
            metadata: { entryId: id },
        });
        await ingestJournalContext(supabase, userId, {
            id,
            title,
            status: 'deleted',
        });

        return new Response(null, { status: 204 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
