import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

async function isMember(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    workspaceId: string,
    userId: string,
): Promise<boolean> {
    const { data: ws } = await supabase
        .from('collaboration_workspaces')
        .select('user_id')
        .eq('id', workspaceId)
        .single();
    if (ws?.user_id === userId) return true;
    const { data: m } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    return !!m;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        if (!(await isMember(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const { searchParams } = new URL(req.url);
        const handoffId = searchParams.get('handoff_id');
        let query = supabase
            .from('workspace_comments')
            .select(
                'id,workspace_id,handoff_id,author_id,body,parent_id,edited,created_at,updated_at',
            )
            .eq('workspace_id', id)
            .order('created_at', { ascending: true });
        if (handoffId) query = query.eq('handoff_id', handoffId);
        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) return NextResponse.json([]);
            throw error;
        }
        return NextResponse.json(data ?? []);
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

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        if (!(await isMember(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const body = (await req.json()) as {
            body: string;
            handoff_id?: string;
            parent_id?: string;
        };
        if (!body.body?.trim())
            return NextResponse.json(
                { error: 'Comment body required' },
                { status: 400 },
            );
        const { data, error } = await supabase
            .from('workspace_comments')
            .insert({
                workspace_id: id,
                author_id: userId,
                body: body.body.trim(),
                handoff_id: body.handoff_id ?? null,
                parent_id: body.parent_id ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'comment_added',
            targetType: 'comment',
            targetId: data.id,
        });
        return NextResponse.json(data, { status: 201 });
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
