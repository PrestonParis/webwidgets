import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    listImportJobs,
    createImportJob,
    addAuditEvent,
} from '@/features/import-export/services/importExportService';

// GET /api/import-export/imports — list user's import jobs
export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const jobs = await listImportJobs(supabase, userId);
        return NextResponse.json({ ok: true, jobs });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { ok: false, error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        }
        if (isMissingTableError(err)) {
            return NextResponse.json({ ok: true, jobs: [] });
        }
        return NextResponse.json(
            { ok: false, error: 'INTERNAL_ERROR' },
            { status: 500 },
        );
    }
}

// POST /api/import-export/imports — create new import job
export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as {
            title?: string;
            format: string;
            source_type?: string;
            destination_type?: string;
            duplicate_strategy?: string;
        };

        if (!body.format) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'MISSING_FORMAT',
                    message: 'format is required',
                },
                { status: 400 },
            );
        }

        if (!['csv', 'json', 'xlsx'].includes(body.format)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'UNSUPPORTED_FORMAT',
                    message: `Format '${body.format}' is not supported. Use csv or json.`,
                },
                { status: 400 },
            );
        }

        const job = await createImportJob(supabase, userId, body);
        void addAuditEvent(
            supabase,
            userId,
            'import_job_created',
            'import_job',
            job.id,
            {
                format: body.format,
                destination_type: body.destination_type,
            },
        );

        return NextResponse.json({ ok: true, job }, { status: 201 });
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
