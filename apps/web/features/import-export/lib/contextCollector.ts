import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listEntries } from '@/features/context/services/contextService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import { buildSystemPrompt } from '@/features/context/lib/contextPrompt';
import type {
    ContextPayload,
    ContextSource,
} from '@/features/chatbot/types/contextPayload';

const DEFAULT_PERMISSIONS = {
    captureWidgetInteractions: true,
    includeQueryGists: true,
    aiPersonalization: true,
};

export interface CollectContextOptions {
    scope?: 'personal' | 'workspace' | 'global';
    includeImportExportService?: boolean;
}

/**
 * Shared context collection logic used by:
 * - /api/chat/context  (AI chat context)
 * - /api/import-export/context-export  (context export bundle)
 */
export async function collectContext(
    supabase: SupabaseClient,
    userId: string,
    options: CollectContextOptions = {},
): Promise<ContextPayload> {
    const scope = options.scope ?? 'personal';
    const sources: ContextSource[] = [];
    const warnings: string[] = [];
    let systemPromptContent = '';

    // ── Source 1: context_entries (context graph) ─────────────────────────────
    let contextGraphStatus: ContextSource['status'] = 'loading';
    let contextEntryCount = 0;
    try {
        const entries = await listEntries(supabase, userId);
        contextEntryCount = entries.length;
        contextGraphStatus = entries.length > 0 ? 'available' : 'empty';

        if (entries.length > 0) {
            const graph = buildContextGraph(entries);
            systemPromptContent = buildSystemPrompt(graph, DEFAULT_PERMISSIONS);
        } else {
            warnings.push(
                'Context graph is empty — add data through the Context page to improve AI responses.',
            );
        }
    } catch (err) {
        const isMissing = isMissingTableError(err);
        contextGraphStatus = isMissing ? 'not_configured' : 'unavailable';
        warnings.push(
            isMissing
                ? 'Context storage table is not set up yet.'
                : 'Failed to load context graph.',
        );
    }

    sources.push({
        id: 'context_graph',
        type: 'context_graph',
        displayName: 'Context Graph',
        status: contextGraphStatus,
        permissionGranted: DEFAULT_PERMISSIONS.aiPersonalization,
        lastSynced: new Date().toISOString(),
        included: contextGraphStatus === 'available',
        itemCount: contextEntryCount,
    });

    // ── Source 2: import/export service ───────────────────────────────────────
    if (options.includeImportExportService) {
        // Import/export service is now integrated — mark as available
        sources.push({
            id: 'import_export_service',
            type: 'import_export_service',
            displayName: 'Import / Export Service',
            status: 'available',
            permissionGranted: true,
            lastSynced: new Date().toISOString(),
            included: true,
            itemCount: 0,
        });
    } else {
        sources.push({
            id: 'import_export_service',
            type: 'import_export_service',
            displayName: 'Import / Export Service',
            status: 'not_configured',
            permissionGranted: false,
            lastSynced: null,
            included: false,
            itemCount: 0,
            error: 'Enable import/export context in settings to include widget data in AI context.',
        });
    }

    // ── Source 3: workspace context ───────────────────────────────────────────
    // Future: load active workspace members/widgets
    sources.push({
        id: 'workspace',
        type: 'workspace',
        displayName: 'Workspace Context',
        status: 'not_configured',
        permissionGranted: false,
        lastSynced: null,
        included: false,
        itemCount: 0,
        error: 'Workspace context collection not yet wired into AI chat.',
    });

    const availableSources = sources.filter(
        (s) => s.status === 'available',
    ).length;
    const unavailableSources = sources.filter(
        (s) => s.status === 'unavailable' || s.status === 'not_configured',
    ).length;

    return {
        contextId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        userId,
        scope,
        sources,
        availableSources,
        unavailableSources,
        systemPromptContent,
        warnings,
    };
}
