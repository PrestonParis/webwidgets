import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
    req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as {
            category?: string;
            entryDate?: string;
            metadata?: Record<string, unknown>;
            tags?: string[];
            notes?: string;
        };

        const patch: Record<string, unknown> = {};
        if (body.category !== undefined) patch.category = body.category;
        if (body.entryDate !== undefined) patch.entry_date = body.entryDate;
        if (body.metadata !== undefined) patch.metadata = body.metadata;
        if (body.tags !== undefined) patch.tags = body.tags;
        if (body.notes !== undefined) patch.notes = body.notes;

        const { data, error } = await supabase
            .from('tracking_entries')
            .update(patch)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;

        const entry = data as { category?: string };
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'tracking',
            eventType: 'tracking.entry_updated',
            sourceId: id,
            sourceTable: 'tracking_entries',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: `Tracking entry updated: ${formatCategory(entry.category ?? 'entry')}`,
            actionUrl: '/tracking',
            metadata: { entryId: id, trackingCategory: entry.category },
        });

        return NextResponse.json(data);
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
            .from('tracking_entries')
            .select('category')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        const { error } = await supabase
            .from('tracking_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;

        const category =
            (existing as { category?: string } | null)?.category ?? 'entry';
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'tracking',
            eventType: 'tracking.entry_deleted',
            sourceId: id,
            sourceTable: 'tracking_entries',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: `Tracking entry deleted: ${formatCategory(category)}`,
            metadata: { entryId: id, trackingCategory: category },
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

function formatCategory(cat: string): string {
    return cat
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
