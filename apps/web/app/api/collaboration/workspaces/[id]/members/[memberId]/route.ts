import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

const ALLOWED_ROLES = ['editor', 'viewer', 'automation'] as const;

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; memberId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, memberId } = await params;

        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        if (!ws || ws.user_id !== userId)
            return NextResponse.json(
                { error: 'Forbidden — only owner can change roles' },
                { status: 403 },
            );

        const body = (await req.json()) as { role?: string };
        if (
            !body.role ||
            !ALLOWED_ROLES.includes(body.role as (typeof ALLOWED_ROLES)[number])
        ) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 },
            );
        }

        const { data, error } = await supabase
            .from('workspace_members')
            .update({ role: body.role, updated_at: new Date().toISOString() })
            .eq('id', memberId)
            .eq('workspace_id', id)
            .select()
            .single();
        if (error) throw error;

        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'member_role_changed',
            targetType: 'member',
            targetId: memberId,
            metadata: { newRole: body.role },
        });
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
    { params }: { params: Promise<{ id: string; memberId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, memberId } = await params;

        const { data: target } = await supabase
            .from('workspace_members')
            .select('user_id,role')
            .eq('id', memberId)
            .eq('workspace_id', id)
            .single();
        if (!target)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        const isOwner = ws?.user_id === userId;
        const isSelf = target.user_id === userId;

        if (!isOwner && !isSelf)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { error } = await supabase
            .from('workspace_members')
            .update({ status: 'removed', updated_at: new Date().toISOString() })
            .eq('id', memberId);
        if (error) throw error;

        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'member_removed',
            targetType: 'member',
            targetId: memberId,
        });
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
