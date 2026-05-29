import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import type { ReadingPosition } from '@/features/reading/types/positions';
import { rowToBookmark } from '@/features/reading/types/annotations';
import type { BookmarkRow } from '@/features/reading/types/annotations';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');
        if (!documentId)
            return NextResponse.json(
                { error: 'Missing documentId' },
                { status: 400 },
            );

        const { data, error } = await supabase
            .from('reading_bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('document_id', documentId)
            .order('created_at', { ascending: false });

        if (error?.code === '42P01') return NextResponse.json([]);
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(
            (data ?? []).map((r) => rowToBookmark(r as unknown as BookmarkRow)),
        );
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const body = (await req.json()) as {
            documentId: string;
            position: ReadingPosition;
            label?: string;
        };

        const { data, error } = (await supabase
            .from('reading_bookmarks')
            .insert({
                user_id: user.id,
                document_id: body.documentId,
                position: body.position,
                ...(body.label !== undefined && { label: body.label }),
            })
            .select()
            .single()) as {
            data: Record<string, unknown> | null;
            error: Error | null;
        };

        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(rowToBookmark(data as unknown as BookmarkRow));
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const { error } = await supabase
            .from('reading_bookmarks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
