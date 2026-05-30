import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listEntries } from '@/features/context/services/contextService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import { buildSystemPrompt } from '@/features/context/lib/contextPrompt';
import { activityAdapter } from '@/features/import-export/adapters/activityAdapter';
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
                'Context graph is empty. Add data through the Context page to improve AI responses.',
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

    // ── Source 3: activity feed (recent platform events) ─────────────────────
    // Gives Claude real-time awareness of what the user has been doing.
    let activityContext = '';
    let activityStatus: ContextSource['status'] = 'loading';
    let activityEventCount = 0;
    try {
        activityContext = await activityAdapter.provideContext!(userId);
        activityEventCount = activityContext
            ? activityContext.split('\n').filter((l) => l.startsWith('- '))
                  .length
            : 0;
        activityStatus = activityEventCount > 0 ? 'available' : 'empty';

        if (activityContext) {
            systemPromptContent = systemPromptContent
                ? `${systemPromptContent}\n\n${activityContext}`
                : activityContext;
        }
    } catch {
        activityStatus = 'unavailable';
        warnings.push('Failed to load recent activity context.');
    }

    sources.push({
        id: 'activity_feed',
        type: 'activity_feed',
        displayName: 'Activity Feed',
        status: activityStatus,
        permissionGranted: DEFAULT_PERMISSIONS.aiPersonalization,
        lastSynced: new Date().toISOString(),
        included: activityStatus === 'available',
        itemCount: activityEventCount,
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
