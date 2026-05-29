import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        // Must be owner or member to list members
        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        if (!ws)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const isOwner = ws.user_id === userId;
        if (!isOwner) {
            const { data: member } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('workspace_id', id)
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();
            if (!member)
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 },
                );
        }

        const { data, error } = await supabase
            .from('workspace_members')
            .select(
                'id,workspace_id,user_id,email,role,status,joined_at,created_at',
            )
            .eq('workspace_id', id)
            .neq('status', 'removed')
            .order('created_at', { ascending: true });
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
