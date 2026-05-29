import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; approvalId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id, approvalId } = await params;
        const body = (await req.json()) as {
            action: 'approve' | 'reject' | 'withdraw';
        };

        const { data: approval } = await supabase
            .from('workspace_approvals')
            .select('*')
            .eq('id', approvalId)
            .eq('workspace_id', id)
            .single();
        if (!approval)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (approval.status !== 'pending')
            return NextResponse.json(
                { error: 'Already resolved' },
                { status: 409 },
            );

        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        const isOwner = ws?.user_id === userId;
        const { data: m } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', id)
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        const isEditor = m?.role === 'editor';
        const isRequester = approval.requester_id === userId;

        if (body.action === 'withdraw' && !isRequester)
            return NextResponse.json(
                { error: 'Only requester can withdraw' },
                { status: 403 },
            );
        if (
            (body.action === 'approve' || body.action === 'reject') &&
            !isOwner &&
            !isEditor
        )
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 },
            );

        const statusMap = {
            approve: 'approved',
            reject: 'rejected',
            withdraw: 'withdrawn',
        } as const;
        const newStatus = statusMap[body.action];
        const { data, error } = await supabase
            .from('workspace_approvals')
            .update({
                status: newStatus,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', approvalId)
            .select()
            .single();
        if (error) throw error;

        const actionMap = {
            approve: 'approval_approved',
            reject: 'approval_rejected',
            withdraw: 'approval_withdrawn',
        } as const;
        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: actionMap[body.action],
            targetType: 'approval',
            targetId: approvalId,
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
