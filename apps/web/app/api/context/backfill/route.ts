import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { runContextBackfill } from '@/features/context/services/contextBackfillService';

export async function POST() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const summary = await runContextBackfill(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ summary });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
