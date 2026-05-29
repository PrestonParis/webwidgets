import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listAuditEvents } from '@/features/import-export/services/importExportService';

// GET /api/import-export/audit — list recent audit events
export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const url = new URL(req.url);
        const limit = Math.min(
            parseInt(url.searchParams.get('limit') ?? '50', 10),
            200,
        );

        const events = await listAuditEvents(supabase, userId, limit);
        return NextResponse.json({ ok: true, events });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { ok: false, error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        }
        if (isMissingTableError(err)) {
            return NextResponse.json({ ok: true, events: [] });
        }
        return NextResponse.json(
            { ok: false, error: 'INTERNAL_ERROR' },
            { status: 500 },
        );
    }
}
