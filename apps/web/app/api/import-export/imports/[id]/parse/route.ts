import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    getImportJob,
    updateImportJob,
    addImportJobLog,
} from '@/features/import-export/services/importExportService';
import {
    detectFormat,
    parseContent,
    inferFieldTypes,
} from '@/features/import-export/lib/fileParser';
import type { ImportFormat } from '@/features/import-export/types/importExport';

// POST /api/import-export/imports/[id]/parse
// Body: { content: string, filename: string }
// Parses file content, updates job status to 'parsed', returns headers + sample rows
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const job = await getImportJob(supabase, userId, id);
        if (!job) {
            return NextResponse.json(
                { ok: false, error: 'JOB_NOT_FOUND' },
                { status: 404 },
            );
        }

        const body = (await req.json()) as {
            content: string;
            filename?: string;
            mime_type?: string;
        };

        if (!body.content) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'MISSING_CONTENT',
                    message: 'content is required',
                },
                { status: 400 },
            );
        }

        // Decode base64 if needed
        let rawContent = body.content;
        try {
            if (/^[A-Za-z0-9+/]+=*$/.test(body.content.slice(0, 100))) {
                const decoded = Buffer.from(body.content, 'base64').toString(
                    'utf-8',
                );
                // Only use decoded if it looks like text
                if (
                    decoded.includes(',') ||
                    decoded.includes('{') ||
                    decoded.includes('[')
                ) {
                    rawContent = decoded;
                }
            }
        } catch {
            // Not base64, use as-is
        }

        // Detect or use job format
        const detectedFormat = body.filename
            ? detectFormat(body.filename, body.mime_type ?? '')
            : null;
        const format: ImportFormat = (detectedFormat ??
            job.format) as ImportFormat;

        if (format === 'xlsx') {
            await updateImportJob(supabase, userId, id, {
                status: 'failed',
                error: 'XLSX_NOT_SUPPORTED',
            });
            return NextResponse.json(
                {
                    ok: false,
                    error: 'XLSX_NOT_SUPPORTED',
                    message:
                        'Excel files are not supported. Install the xlsx package to enable XLSX imports.',
                },
                { status: 422 },
            );
        }

        const parseResult = parseContent(rawContent, format);

        if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
            const errMsg = parseResult.errors[0]?.message ?? 'Parse failed';
            await updateImportJob(supabase, userId, id, {
                status: 'failed',
                error: errMsg,
            });
            void addImportJobLog(supabase, id, 'error', errMsg);
            return NextResponse.json(
                { ok: false, error: 'PARSE_FAILED', message: errMsg },
                { status: 422 },
            );
        }

        // Update job with parse summary
        await updateImportJob(supabase, userId, id, {
            status: 'parsed',
            row_count: parseResult.totalRows,
            format,
        });

        void addImportJobLog(
            supabase,
            id,
            'info',
            `Parsed ${parseResult.totalRows} rows, ${parseResult.headers.length} columns`,
            undefined,
            { headers: parseResult.headers },
        );

        if (parseResult.errors.length > 0) {
            for (const e of parseResult.errors.slice(0, 10)) {
                void addImportJobLog(supabase, id, 'warn', e.message, e.row);
            }
        }

        const fieldTypes = inferFieldTypes(parseResult.rows);
        const sampleRows = parseResult.rows.slice(0, 5);

        return NextResponse.json({
            ok: true,
            headers: parseResult.headers,
            totalRows: parseResult.totalRows,
            sampleRows,
            fieldTypes,
            parseErrors: parseResult.errors,
        });
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
