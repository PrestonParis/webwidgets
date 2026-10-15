import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { deleteContextEdge } from '@/features/context/services/contextService';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const deleted = await deleteContextEdge(supabase, userId, id);
        if (!deleted)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('Only explicit edges'))
            return NextResponse.json({ error: msg }, { status: 409 });
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
