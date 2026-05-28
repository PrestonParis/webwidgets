import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { deleteEntry } from '@/features/context/services/contextService';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ entityId: string }> },
) {
    try {
        const { entityId } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        await deleteEntry(
            supabase as unknown as SupabaseClient,
            userId,
            decodeURIComponent(entityId),
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
