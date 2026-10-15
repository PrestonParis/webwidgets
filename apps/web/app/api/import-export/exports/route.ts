import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    convertHtmlToDocument,
    type DocumentConvertFormat,
} from '@/features/convert/lib/serverDocumentConverter';
import { getOutputMimeType } from '@/features/files/lib/conversionService';

// Max concurrent adapter calls per export request — prevents slamming Supabase
// when multi-source exports are added.
const adapterLimit = pLimit(4);
import {
    listExportJobs,
    createExportJob,
    updateExportJob,
    addAuditEvent,
} from '@/features/import-export/services/importExportService';
import { getAdapter } from '@/features/import-export/lib/adapterRegistry';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import { ingestContextFromAdapterPayload } from '@/features/import-export/lib/contextMapper';
import { rowsToCSV } from '@/features/import-export/lib/csvSerialization';

function ensureAdapters() {
    registerCoreImportExportAdapters();
}

// GET /api/import-export/exports — list export jobs
export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const jobs = await listExportJobs(supabase, userId);
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

// POST /api/import-export/exports — create + execute export job
export async function POST(req: Request) {
    ensureAdapters();

    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as {
            source_type: string;
            format: string;
            title?: string;
            // When true (used by dashboard runtime), skip job persistence and
            // return data directly. Faster for widget data reads.
            inline?: boolean;
            ingest_context?: boolean;
            // Optional date range — passed through to adapters that support it
            // (e.g. calendarEventsAdapter for month-grid queries).
            start_date?: string;
            end_date?: string;
        };

        if (!body.source_type) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'MISSING_SOURCE_TYPE',
                    message: 'source_type is required',
                },
                { status: 400 },
            );
        }

        const format = body.format ?? 'json';
        const documentFormats: DocumentConvertFormat[] = [
            'docx',
            'pdf',
            'rtf',
            'odt',
            'epub',
        ];
        const textFormats = ['csv', 'json'];
        if (![...textFormats, ...documentFormats].includes(format)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'UNSUPPORTED_FORMAT',
                    message: `Format '${format}' is not supported. Use csv, json, docx, or pdf.`,
                },
                { status: 400 },
            );
        }

        const adapter = getAdapter(body.source_type);
        if (!adapter) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'ADAPTER_NOT_FOUND',
                    message: `No adapter for source type '${body.source_type}'`,
                },
                { status: 422 },
            );
        }
        if (!adapter.canExport || !adapter.exportData) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'EXPORT_NOT_SUPPORTED',
                    message: `The '${body.source_type}' adapter does not support exports`,
                },
                { status: 422 },
            );
        }

        // Build options passed to the adapter (applies to both inline and job modes)
        const adapterOptions = {
            format: 'json' as const,
            ...(body.start_date ? { startDate: body.start_date } : {}),
            ...(body.end_date ? { endDate: body.end_date } : {}),
        };

        // Inline mode: skip job persistence, return data directly (used by dashboard runtime)
        if (body.inline) {
            const result = await adapterLimit(() =>
                adapter.exportData!(userId, adapterOptions),
            );
            if (body.ingest_context) {
                void ingestContextFromAdapterPayload(
                    supabase,
                    userId,
                    body.source_type,
                    result.rows,
                ).catch((error) =>
                    console.warn(
                        '[import-export] context ingestion skipped:',
                        error,
                    ),
                );
            }
            // If the adapter produced a rich inlinePayload (e.g. habits + completions),
            // return it as `data` so useWidgetData gets the full structure.
            // Otherwise fall back to the flat `records` array.
            return NextResponse.json({
                ok: true,
                source_type: body.source_type,
                ...(result.inlinePayload !== undefined
                    ? { data: result.inlinePayload }
                    : { records: result.rows.map((r) => r.data) }),
                warnings: result.warnings,
                fetchedAt: new Date().toISOString(),
            });
        }

        // Document format path (docx, pdf, etc.) — requires adapter.exportDocument
        if (documentFormats.includes(format as DocumentConvertFormat)) {
            if (!adapter.exportDocument) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: 'UNSUPPORTED_FORMAT',
                        message: `The '${body.source_type}' adapter does not support document export (docx/pdf).`,
                    },
                    { status: 422 },
                );
            }

            const docResult = await adapterLimit(() =>
                adapter.exportDocument!(userId, {
                    format: format as 'docx' | 'pdf',
                    ...(body.start_date ? { startDate: body.start_date } : {}),
                    ...(body.end_date ? { endDate: body.end_date } : {}),
                }),
            );

            const docTitle =
                body.title ??
                `${adapter.displayName} export ${new Date().toISOString().slice(0, 10)}`;

            const docBytes = await convertHtmlToDocument({
                html: docResult.html,
                title: docTitle,
                targetExtension: format as DocumentConvertFormat,
            });

            const contentType = getOutputMimeType(
                format as Parameters<typeof getOutputMimeType>[0],
            );
            const safeFilename =
                docTitle
                    .trim()
                    .replace(/[^a-zA-Z0-9._-]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 80) || body.source_type;
            const filename = `${safeFilename}.${format}`;

            const base64Content = Buffer.from(docBytes).toString('base64');

            return NextResponse.json({
                ok: true,
                job: {
                    id: `doc-export-${Date.now()}`,
                    status: 'ready',
                    sourceType: body.source_type,
                    format,
                    title: docTitle,
                    rowCount: null,
                },
                warnings: docResult.warnings,
                download: {
                    content: base64Content,
                    encoding: 'base64',
                    contentType,
                    filename,
                    sizeBytes: docBytes.byteLength,
                },
            });
        }

        const title =
            body.title ??
            `${adapter.displayName} export ${new Date().toISOString().slice(0, 10)}`;

        // Create job record
        const job = await createExportJob(supabase, userId, {
            title,
            source_type: body.source_type,
            format,
        });

        // Collect data — wrapped in adapterLimit for future multi-source support
        await updateExportJob(supabase, userId, job.id, {
            status: 'collecting',
        });
        const exportResult = await adapterLimit(() =>
            adapter.exportData!(userId, {
                ...adapterOptions,
                format: format as 'csv' | 'json',
            }),
        );
        void ingestContextFromAdapterPayload(
            supabase,
            userId,
            body.source_type,
            exportResult.rows,
        ).catch((error) =>
            console.warn('[import-export] context ingestion skipped:', error),
        );

        // Generate output
        await updateExportJob(supabase, userId, job.id, {
            status: 'generating',
        });

        let outputContent: string;
        let contentType: string;
        let filename: string;

        if (format === 'csv') {
            outputContent = rowsToCSV(exportResult.rows);
            contentType = 'text/csv';
            filename = `${body.source_type}-export-${Date.now()}.csv`;
        } else {
            outputContent = JSON.stringify(
                exportResult.rows.map((r) => r.data),
                null,
                2,
            );
            contentType = 'application/json';
            filename = `${body.source_type}-export-${Date.now()}.json`;
        }

        const outputSizeBytes = Buffer.byteLength(outputContent, 'utf-8');

        // Mark ready
        await updateExportJob(supabase, userId, job.id, {
            status: 'ready',
            row_count: exportResult.rows.length,
            output_size_bytes: outputSizeBytes,
            completed_at: new Date().toISOString(),
        });

        void addAuditEvent(
            supabase,
            userId,
            'export_job_completed',
            'export_job',
            job.id,
            {
                source_type: body.source_type,
                format,
                rowCount: exportResult.rows.length,
            },
        );

        return NextResponse.json({
            ok: true,
            job: {
                ...job,
                status: 'ready',
                rowCount: exportResult.rows.length,
            },
            warnings: exportResult.warnings,
            download: {
                content: outputContent,
                contentType,
                filename,
                sizeBytes: outputSizeBytes,
            },
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
