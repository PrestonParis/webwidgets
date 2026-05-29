import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get('limit') ?? '30'), 100);

        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        if (!ws)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (ws.user_id !== userId) {
            const { data: m } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('workspace_id', id)
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();
            if (!m)
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 },
                );
        }

        const { data, error } = await supabase
            .from('workspace_activity')
            .select(
                'id,workspace_id,actor_id,actor_email,action,target_type,target_id,metadata,created_at',
            )
            .eq('workspace_id', id)
            .order('created_at', { ascending: false })
            .limit(limit);
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
