import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import type { ReadingPosition } from '@/features/reading/types/positions';
import { rowToNote } from '@/features/reading/types/annotations';
import type { NoteRow } from '@/features/reading/types/annotations';

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
            .from('reading_notes')
            .select('*')
            .eq('user_id', user.id)
            .eq('document_id', documentId)
            .order('created_at', { ascending: false });

        if (error?.code === '42P01') return NextResponse.json([]);
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(
            (data ?? []).map((r) => rowToNote(r as unknown as NoteRow)),
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
            content: string;
        };

        const { data, error } = await supabase
            .from('reading_notes')
            .insert({
                user_id: user.id,
                document_id: body.documentId,
                position: body.position,
                content: body.content,
            })
            .select()
            .single();

        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(rowToNote(data as unknown as NoteRow));
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const body = (await req.json()) as { id: string; content: string };

        const { data, error } = await supabase
            .from('reading_notes')
            .update({
                content: body.content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', body.id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(rowToNote(data as unknown as NoteRow));
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
            .from('reading_notes')
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
