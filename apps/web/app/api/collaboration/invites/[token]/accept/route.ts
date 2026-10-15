import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { token } = await params;

        const supabaseAdmin = createAdminClient();

        const { data: invite } = await supabaseAdmin
            .from('workspace_invites')
            .select('id,workspace_id,email,role,status,expires_at')
            .eq('token', token)
            .single();

        if (!invite)
            return NextResponse.json(
                { error: 'Invalid invite' },
                { status: 404 },
            );
        if (invite.status !== 'pending')
            return NextResponse.json(
                { error: 'Invite already used or revoked' },
                { status: 410 },
            );
        if (new Date(invite.expires_at) < new Date())
            return NextResponse.json(
                { error: 'Invite expired' },
                { status: 410 },
            );

        // Get acceptor email for audit
        const {
            data: { user },
        } = await supabaseAdmin.auth.admin.getUserById(userId);
        const acceptorEmail = user?.email ?? '';

        // Check not already a member
        const { data: existing } = await supabaseAdmin
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', invite.workspace_id)
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        if (existing)
            return NextResponse.json(
                { error: 'Already a member', workspaceId: invite.workspace_id },
                { status: 200 },
            );

        // Claim the invite with a conditional update so two concurrent
        // accepts cannot both pass the pending check above.
        const { data: claimed } = await supabaseAdmin
            .from('workspace_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle();
        if (!claimed)
            return NextResponse.json(
                { error: 'Invite already used or revoked' },
                { status: 410 },
            );

        const { error: memberError } = await supabaseAdmin
            .from('workspace_members')
            .insert({
                workspace_id: invite.workspace_id,
                user_id: userId,
                email: acceptorEmail,
                role: invite.role,
                status: 'active',
                joined_at: new Date().toISOString(),
            });
        if (memberError) {
            await supabaseAdmin
                .from('workspace_invites')
                .update({ status: 'pending' })
                .eq('id', invite.id);
            throw memberError;
        }

        await logActivity(supabase, {
            workspaceId: invite.workspace_id,
            actorId: userId,
            actorEmail: acceptorEmail,
            action: 'member_joined',
            targetType: 'member',
            targetId: userId,
        });

        return NextResponse.json({ workspaceId: invite.workspace_id });
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
