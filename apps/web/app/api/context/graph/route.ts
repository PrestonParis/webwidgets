import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listEntries,
    listEdges,
} from '@/features/context/services/contextService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const entries = await listEntries(
            supabase as unknown as SupabaseClient,
            userId,
            { limit: 2000 },
        );
        const edges = await listEdges(
            supabase as unknown as SupabaseClient,
            userId,
        );
        const graph = buildContextGraph(entries, edges);
        return NextResponse.json(graph);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
