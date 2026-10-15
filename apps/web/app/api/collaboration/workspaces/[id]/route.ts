import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import type { TablesUpdate } from '@/types/supabase';

const ALLOWED_UPDATE_FIELDS = [
    'name',
    'scope',
    'description',
    'status',
] as const;

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        // Only workspace owner can edit settings
        const { data: ws } = await supabase
            .from('collaboration_workspaces')
            .select('user_id')
            .eq('id', id)
            .single();
        if (!ws || ws.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        // The deployed collaboration_workspaces table has no updated_at column.
        const patch: TablesUpdate<'collaboration_workspaces'> = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            const value = body[field];
            if (typeof value === 'string') patch[field] = value;
        }
        if (body.description === null) patch.description = null;

        const { data, error } = await supabase
            .from('collaboration_workspaces')
            .update(patch)
            .eq('id', id)
            .select('id,user_id,name,scope,description,status,created_at')
            .single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const { error } = await supabase
            .from('collaboration_workspaces')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
