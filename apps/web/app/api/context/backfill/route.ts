import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { runContextBackfill } from '@/features/context/services/contextBackfillService';

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const url = new URL(req.url);
        const includeDiagnostics =
            url.searchParams.get('diagnostics') === 'true';

        const summary = await runContextBackfill(
            supabase as unknown as SupabaseClient,
            userId,
        );

        if (includeDiagnostics) {
            return NextResponse.json({
                summary,
                diagnostics: {
                    sourcesAttempted: summary.sources.length,
                    sourcesSkipped: summary.sources.filter(
                        (s) => s.skippedReason,
                    ).length,
                    sourcesWithErrors: summary.sources.filter(
                        (s) => s.errors.length > 0,
                    ).length,
                    sourcesWithData: summary.sources.filter(
                        (s) => s.recordsFound > 0,
                    ).length,
                    sourceBreakdown: summary.sources.map((s) => ({
                        source: s.source,
                        recordsFound: s.recordsFound,
                        nodesCreated: s.nodesCreated,
                        nodesUpdated: s.nodesUpdated,
                        edgesCreated: s.edgesCreated,
                        edgesUpdated: s.edgesUpdated,
                        skippedReason: s.skippedReason,
                        errors: s.errors,
                    })),
                },
            });
        }

        return NextResponse.json({ summary });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
