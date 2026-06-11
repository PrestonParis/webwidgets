import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { ingestDocumentContext } from '@/features/context/services/contextProducerService';

export async function GET(): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { data, error } = await supabase
            .from('journals')
            .select(
                'id, title, content, type, created_at, updated_at, metadata',
            )
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) return NextResponse.json({ entries: [] });
        return NextResponse.json({ entries: data ?? [] });
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
            title?: string;
            content?: string;
            type?: 'journal' | 'document' | 'note';
            metadata?: Record<string, unknown>;
        };

        const title = (body.title ?? '').trim() || 'Untitled';
        const content = body.content ?? '';
        const type = body.type ?? 'journal';

        const { data, error } = await supabase
            .from('journals')
            .insert({
                user_id: userId,
                title,
                content,
                type,
                metadata: body.metadata ?? null,
            })
            .select('id, title, content, type, created_at, metadata')
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'INTERNAL_ERROR' },
                { status: 500 },
            );
        }

        const entry = data as {
            id: string;
            title: string;
            content?: string;
            type: string;
        };

        // Ingest into context graph
        await ingestDocumentContext(supabase, userId, {
            id: entry.id,
            title: entry.title,
            ...(entry.content !== undefined ? { content: entry.content } : {}),
            type: entry.type,
        });

        return NextResponse.json({ entry: data }, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
