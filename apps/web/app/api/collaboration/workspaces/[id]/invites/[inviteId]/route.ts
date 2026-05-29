import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, inviteId } = await params;
        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        const isOwner = ws?.user_id === userId;
        if (!isOwner) {
            const { data: m } = await supabase
                .from('workspace_members')
                .select('role')
                .eq('workspace_id', id)
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();
            if (m?.role !== 'editor')
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 },
                );
        }
        const { error } = await supabase
            .from('workspace_invites')
            .update({ status: 'revoked' })
            .eq('id', inviteId)
            .eq('workspace_id', id);
        if (error) throw error;
        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'invite_revoked',
            targetType: 'invite',
            targetId: inviteId,
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
