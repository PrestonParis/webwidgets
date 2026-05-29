import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await params;
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('workspace_invites')
            .select('id,workspace_id,email,role,status,expires_at')
            .eq('token', token)
            .single();
        if (error || !data)
            return NextResponse.json(
                { error: 'Invalid invite' },
                { status: 404 },
            );
        if (data.status !== 'pending')
            return NextResponse.json(
                {
                    error:
                        data.status === 'accepted'
                            ? 'Already accepted'
                            : 'Invite revoked or expired',
                },
                { status: 410 },
            );
        if (new Date(data.expires_at) < new Date())
            return NextResponse.json(
                { error: 'Invite expired' },
                { status: 410 },
            );

        const { data: ws } = await supabaseAdmin
            .from('collaboration_workspaces')
            .select('name,scope')
            .eq('id', data.workspace_id)
            .single();
        return NextResponse.json({
            invite: {
                ...data,
                workspaceName: ws?.name ?? 'Workspace',
                workspaceScope: ws?.scope ?? 'General',
            },
        });
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
