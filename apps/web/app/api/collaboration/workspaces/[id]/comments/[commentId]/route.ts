import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; commentId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, commentId } = await params;
        const { data: comment } = await supabase
            .from('workspace_comments')
            .select('author_id')
            .eq('id', commentId)
            .eq('workspace_id', id)
            .single();
        if (!comment || comment.author_id !== userId)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const body = (await req.json()) as { body: string };
        if (!body.body?.trim())
            return NextResponse.json(
                { error: 'Body required' },
                { status: 400 },
            );
        const { data, error } = await supabase
            .from('workspace_comments')
            .update({
                body: body.body.trim(),
                edited: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', commentId)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; commentId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, commentId } = await params;
        const { data: comment } = await supabase
            .from('workspace_comments')
            .select('author_id')
            .eq('id', commentId)
            .eq('workspace_id', id)
            .single();
        if (!comment)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        const isOwner = ws?.user_id === userId;
        if (!isOwner && comment.author_id !== userId)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const { error } = await supabase
            .from('workspace_comments')
            .delete()
            .eq('id', commentId);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
