import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getExportJob } from '@/features/import-export/services/importExportService';

// GET /api/import-export/exports/[id] — get export job details
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const job = await getExportJob(supabase, userId, id);
        if (!job) {
            return NextResponse.json(
                { ok: false, error: 'JOB_NOT_FOUND' },
                { status: 404 },
            );
        }

        // Fetch logs
        const { data: logs } = await supabase
            .from('export_job_logs')
            .select('id,level,message,metadata,created_at')
            .eq('export_job_id', id)
            .order('created_at', { ascending: true })
            .limit(100);

        return NextResponse.json({ ok: true, job, logs: logs ?? [] });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { ok: false, error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { ok: false, error: 'INTERNAL_ERROR' },
            { status: 500 },
        );
    }
}
