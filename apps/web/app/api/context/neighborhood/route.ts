import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getContextNeighborhood } from '@/features/context/services/contextTraversalService';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);
        const entityId = searchParams.get('entityId');
        if (!entityId)
            return NextResponse.json(
                { error: 'Missing entityId' },
                { status: 400 },
            );
        const graph = await getContextNeighborhood(
            supabase,
            userId,
            entityId,
            Number(searchParams.get('depth') ?? 1),
        );
        return NextResponse.json(graph);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
