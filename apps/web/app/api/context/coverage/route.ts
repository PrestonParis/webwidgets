import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getRuntimeContextCoverageReport } from '@/features/context/services/contextCoverageService';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const report = await getRuntimeContextCoverageReport(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json(report);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
