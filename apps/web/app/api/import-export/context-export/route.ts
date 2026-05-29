import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    listContextExports,
    createContextExport,
    addAuditEvent,
} from '@/features/import-export/services/importExportService';
import { collectContext } from '@/features/import-export/lib/contextCollector';

// GET /api/import-export/context-export — list recent context exports
export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const exports = await listContextExports(supabase, userId);
        return NextResponse.json({ ok: true, exports });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { ok: false, error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        }
        if (isMissingTableError(err)) {
            return NextResponse.json({ ok: true, exports: [] });
        }
        return NextResponse.json(
            { ok: false, error: 'INTERNAL_ERROR' },
            { status: 500 },
        );
    }
}

// POST /api/import-export/context-export — create + execute context export
export async function POST() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        // Collect context using shared collector
        const payload = await collectContext(supabase, userId, {
            scope: 'personal',
            includeImportExportService: true,
        });

        const status =
            payload.availableSources === 0
                ? 'empty'
                : payload.unavailableSources > 0
                  ? 'ready' // partial
                  : 'ready';

        // Persist to context_exports
        const record = await createContextExport(supabase, userId, {
            scope: payload.scope,
            status,
            sources: payload.sources,
            system_prompt_content: payload.systemPromptContent,
            warnings: payload.warnings,
            errors: [],
            available_sources: payload.availableSources,
            unavailable_sources: payload.unavailableSources,
        });

        void addAuditEvent(
            supabase,
            userId,
            'context_export_created',
            'context_export',
            record.id,
            {
                availableSources: payload.availableSources,
                promptLength: payload.systemPromptContent?.length ?? 0,
            },
        );

        return NextResponse.json({
            ok: true,
            export: record,
            payload,
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { ok: false, error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        }
        if (isMissingTableError(err)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'TABLE_NOT_FOUND',
                    message:
                        'context_exports table not yet set up. Run the migration.',
                },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: 'INTERNAL_ERROR' },
            { status: 500 },
        );
    }
}
