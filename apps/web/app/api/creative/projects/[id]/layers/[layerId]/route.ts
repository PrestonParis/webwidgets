import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; layerId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { layerId } = await params;
        const body = await req.json() as Record<string, unknown>;
        const { data, error } = await supabase
            .from('creative_layers')
            .update(body)
            .eq('id', layerId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; layerId: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { layerId } = await params;
        const { error } = await supabase
            .from('creative_layers')
            .delete()
            .eq('id', layerId)
            .eq('user_id', userId);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
