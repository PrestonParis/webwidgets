import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    ingestContextEdge,
    listEdges,
} from '@/features/context/services/contextService';
import { contextEdgeInputSchema } from '@/features/context/types/schemas';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);
        const fromEntityId = searchParams.get('from');
        const toEntityId = searchParams.get('to');
        const kinds = searchParams.getAll('kind');
        const edges = await listEdges(supabase, userId, {
            ...(fromEntityId ? { fromEntityId } : {}),
            ...(toEntityId ? { toEntityId } : {}),
            ...(kinds.length > 0 ? { kinds } : {}),
        });
        return NextResponse.json({ edges });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = contextEdgeInputSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const edge = await ingestContextEdge(supabase, userId, body.data);
        return NextResponse.json({ edge });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
