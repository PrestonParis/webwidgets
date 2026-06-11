import type { SupabaseClient } from '@supabase/supabase-js';
import { buildContextBundle } from '@/features/context/services/contextBundleService';
import { getContextPermissions } from '@/features/context/services/contextPermissionsService';
import { activityAdapter } from '@/features/import-export/adapters/activityAdapter';
import type {
    ContextPayload,
    ContextSource,
} from '@/features/chatbot/types/contextPayload';

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

    let permissionGranted = true;
    try {
        const permissions = await getContextPermissions(supabase, userId);
        permissionGranted = permissions.allowAIPersonalization;
        const bundle = await buildContextBundle(supabase, userId, {
            consumer: 'chat',
            maxNodes: 40,
            maxPromptChars: 7000,
        });
        systemPromptContent = bundle.promptSection;
        warnings.push(...bundle.warnings);
        sources.push({
            id: 'context_graph',
            type: 'context_graph',
            displayName: 'Context Graph',
            status: !permissionGranted
                ? 'permission_denied'
                : bundle.nodes.length > 0
                  ? 'available'
                  : 'empty',
            permissionGranted,
            lastSynced: new Date().toISOString(),
            included: permissionGranted && bundle.nodes.length > 0,
            itemCount: bundle.nodes.length,
        });
        if (bundle.nodes.length === 0 && permissionGranted) {
            warnings.push(
                'Context graph is empty. Add data through the Context page or platform activity to improve AI responses.',
            );
        } else {
            sources.push({
                id: 'context_edges',
                type: 'context_graph',
                displayName: 'Context Relationships',
                status: bundle.edges.length > 0 ? 'available' : 'empty',
                permissionGranted,
                lastSynced: new Date().toISOString(),
                included: permissionGranted && bundle.edges.length > 0,
                itemCount: bundle.edges.length,
            });
        }
    } catch (err) {
        warnings.push(
            err instanceof Error
                ? `Failed to load context bundle: ${err.message}`
                : 'Failed to load context bundle.',
        );
        sources.push({
            id: 'context_graph',
            type: 'context_graph',
            displayName: 'Context Graph',
            status: 'unavailable',
            permissionGranted,
            lastSynced: new Date().toISOString(),
            included: false,
            itemCount: 0,
        });
    }

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
        if (!permissionGranted) {
            activityStatus = 'permission_denied';
        } else {
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
        permissionGranted,
        lastSynced: new Date().toISOString(),
        included: permissionGranted && activityStatus === 'available',
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
