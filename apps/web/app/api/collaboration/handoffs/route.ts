import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get('workspace_id');

        let query = supabase
            .from('collaboration_handoffs')
            .select('id,user_id,workspace_id,title,owner,scope,priority,due,complete,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (workspaceId) query = query.eq('workspace_id', workspaceId);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) return NextResponse.json([]);
            throw error;
        }
        return NextResponse.json(data ?? []);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = await req.json() as {
            title: string;
            owner?: string;
            scope?: string;
            priority?: string;
            due?: string;
            workspace_id?: string;
        };
        const { data, error } = await supabase
            .from('collaboration_handoffs')
            .insert({
                user_id: userId,
                title: body.title,
                owner: body.owner ?? null,
                scope: body.scope ?? 'General',
                priority: body.priority ?? 'medium',
                due: body.due ?? null,
                workspace_id: body.workspace_id ?? null,
                complete: false,
            })
            .select('id,user_id,workspace_id,title,owner,scope,priority,due,complete,created_at')
            .single();
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
