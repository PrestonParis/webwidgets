import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    getImportJob,
    updateImportJob,
    addImportJobLog,
    addAuditEvent,
} from '@/features/import-export/services/importExportService';
import {
    getAdapter,
    registerAdapter,
} from '@/features/import-export/lib/adapterRegistry';
import { trackingEntriesAdapter } from '@/features/import-export/adapters/trackingEntriesAdapter';
import { todosAdapter } from '@/features/import-export/adapters/todosAdapter';
import type {
    FieldMapping,
    MappedRow,
    DuplicateStrategy,
} from '@/features/import-export/types/importExport';

// Ensure adapters registered
function ensureAdapters() {
    [trackingEntriesAdapter, todosAdapter].forEach(registerAdapter);
}

function applyMappings(
    rawRows: { rowIndex: number; raw: Record<string, string> }[],
    mappings: FieldMapping[],
): MappedRow[] {
    return rawRows.map((row) => {
        const data: Record<string, unknown> = {};
        for (const m of mappings) {
            if (m.sourceColumn in row.raw) {
                data[m.targetField] = row.raw[m.sourceColumn];
            }
        }
        return { rowIndex: row.rowIndex, data };
    });
}

// POST /api/import-export/imports/[id]/execute
// Body: { mappings: FieldMapping[], duplicate_strategy: string, rows?: ParsedRow[] }
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    ensureAdapters();

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

        // Only allow executing jobs that are in a valid state
        const validStates = [
            'draft',
            'parsed',
            'mapped',
            'validated',
            'ready',
            'completed_with_warnings',
        ];
        if (!validStates.includes(job.status)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'INVALID_JOB_STATE',
                    message: `Job status '${job.status}' cannot be executed. Expected one of: ${validStates.join(', ')}`,
                },
                { status: 409 },
            );
        }

        const body = (await req.json()) as {
            mappings: FieldMapping[];
            duplicate_strategy?: DuplicateStrategy;
            rows?: Array<{ rowIndex: number; raw: Record<string, string> }>;
        };

        if (!body.mappings || body.mappings.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'MISSING_MAPPINGS',
                    message: 'At least one field mapping is required',
                },
                { status: 400 },
            );
        }

        const strategy: DuplicateStrategy = body.duplicate_strategy ?? 'skip';
        const destinationType = job.destinationType ?? 'tracking_entries';
        const adapter = getAdapter(destinationType);

        if (!adapter) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'ADAPTER_NOT_FOUND',
                    message: `No adapter registered for destination type '${destinationType}'`,
                },
                { status: 422 },
            );
        }

        if (!adapter.canImport || !adapter.importData) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'IMPORT_NOT_SUPPORTED',
                    message: `The '${destinationType}' adapter does not support imports`,
                },
                { status: 422 },
            );
        }

        // Mark as running
        await updateImportJob(supabase, userId, id, {
            status: 'running',
            mappings: body.mappings,
            duplicate_strategy: strategy,
        });

        void addImportJobLog(
            supabase,
            id,
            'info',
            `Starting import with strategy '${strategy}' into '${destinationType}'`,
        );

        // Apply mappings to the provided rows (or an empty set if not provided)
        const rawRows = body.rows ?? [];
        const mappedRows = applyMappings(rawRows, body.mappings);

        // Execute
        const result = await adapter.importData(userId, mappedRows, strategy);

        // Log errors
        for (const e of result.errors.slice(0, 50)) {
            void addImportJobLog(supabase, id, 'error', e.message, e.rowIndex);
        }
        for (const w of result.warnings.slice(0, 50)) {
            void addImportJobLog(supabase, id, 'warn', w);
        }

        const finalStatus =
            result.errorCount > 0 && result.successCount > 0
                ? 'completed_with_warnings'
                : result.errorCount > 0
                  ? 'failed'
                  : 'completed';

        await updateImportJob(supabase, userId, id, {
            status: finalStatus,
            success_count: result.successCount,
            error_count: result.errorCount,
            warning_count: result.warningCount,
            completed_at: new Date().toISOString(),
        });

        void addAuditEvent(
            supabase,
            userId,
            'import_job_completed',
            'import_job',
            id,
            {
                status: finalStatus,
                successCount: result.successCount,
                errorCount: result.errorCount,
            },
        );

        void addImportJobLog(
            supabase,
            id,
            result.errorCount > 0 ? 'warn' : 'info',
            `Import complete: ${result.successCount} succeeded, ${result.errorCount} failed`,
        );

        return NextResponse.json({
            ok: true,
            status: finalStatus,
            successCount: result.successCount,
            errorCount: result.errorCount,
            warningCount: result.warningCount,
            errors: result.errors.slice(0, 20),
            warnings: result.warnings.slice(0, 20),
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
