import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);

        let query = supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .order('entry_date', { ascending: false });

        const category = searchParams.get('category');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const limit = searchParams.get('limit');

        if (category) query = query.eq('category', category);
        if (from) query = query.gte('entry_date', from);
        if (to) query = query.lte('entry_date', to);
        if (limit) query = query.limit(parseInt(limit, 10));

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) return NextResponse.json([]);
            throw error;
        }
        return NextResponse.json(data ?? []);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as {
            category: string;
            entryDate: string;
            metadata?: Record<string, unknown>;
            tags?: string[];
            notes?: string;
            source?: string;
        };

        const { data, error } = await supabase
            .from('tracking_entries')
            .insert({
                user_id: userId,
                category: body.category,
                entry_date: body.entryDate,
                metadata: body.metadata ?? {},
                tags: body.tags ?? [],
                source: body.source ?? 'manual',
                ...(body.notes !== undefined ? { notes: body.notes } : {}),
            })
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error))
                return NextResponse.json(
                    { error: 'TABLE_NOT_FOUND' },
                    { status: 503 },
                );
            throw error;
        }

        // Build a human-readable label from the metadata if possible
        const meta = body.metadata ?? {};
        const valueLabel = getValueLabel(body.category, meta);
        const title = `${formatCategory(body.category)} logged${valueLabel}`;

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'tracking',
            eventType: 'tracking.entry_created',
            sourceId: (data as { id?: string }).id,
            sourceTable: 'tracking_entries',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title,
            actionUrl: '/tracking',
            metadata: {
                trackingCategory: body.category,
                entryDate: body.entryDate,
                metadataSummary: Object.keys(meta).slice(0, 5),
            },
        });

        return NextResponse.json(data, { status: 201 });
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

function getValueLabel(
    category: string,
    meta: Record<string, unknown>,
): string {
    const val =
        meta['value'] ??
        meta['duration'] ??
        meta['amount'] ??
        meta['count'] ??
        meta['score'] ??
        meta['weight'];
    const unit = meta['unit'] ?? meta['units'] ?? '';
    if (val !== undefined)
        return `: ${String(val)}${unit ? ' ' + String(unit) : ''}`;
    if (category === 'sleep' && meta['hours'])
        return `: ${String(meta['hours'])}h`;
    if (category === 'mood' && meta['rating'])
        return `: ${String(meta['rating'])}/10`;
    return '';
}
