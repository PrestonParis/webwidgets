import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listEntries,
    listEdges,
} from '@/features/context/services/contextService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import type { ContextEntry } from '@/features/context/types/context';
import { getWidgetMeta } from '@/features/context/lib/widgetContextMap';
import { getAllManifests } from '@/features/dashboard/runtime/widgetManifestRegistry';
import type { WidgetType } from '@/features/dashboard/types/dashboard';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const url = new URL(req.url);
        const includeDiagnostics =
            url.searchParams.get('diagnostics') === 'true';

        const entries = await listEntries(supabase, userId, { limit: 2000 });
        const edges = await listEdges(supabase, userId);

        // Add widget catalog nodes
        try {
            const manifests = getAllManifests().filter(
                (manifest) => manifest.widgetType !== 'context-diagram',
            );

            for (const manifest of manifests) {
                const meta = getWidgetMeta(manifest.widgetType as WidgetType);
                const widgetEntry: ContextEntry = {
                    id: `widget-catalog-${manifest.widgetType}`,
                    userId,
                    entryType: 'widget',
                    entityId: `widget-${manifest.widgetType}`,
                    label: meta.label || manifest.widgetType,
                    summary: meta.description,
                    data: {
                        widgetType: manifest.widgetType,
                        category: meta.category,
                        priority: manifest.priority ?? 'normal',
                        aboveFold: manifest.aboveFold ?? false,
                        dataRequirements: manifest.dataRequirements ?? [],
                        acceptsSchemas: manifest.acceptsSchemas ?? [],
                        exportsSchemas: manifest.exportsSchemas ?? [],
                        context: manifest.context ?? null,
                    },
                    tags: ['widget', meta.category, manifest.widgetType].filter(
                        Boolean,
                    ),
                    sourceType: 'widget_catalog',
                    sourceId: manifest.widgetType,
                    sourceCollection: 'dashboard_runtime_manifests',
                    createdByType: 'system',
                    permissions: ['private', 'ai', 'cross_widget'],
                    linkedTo: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                entries.push(widgetEntry);
            }
        } catch (error) {
            console.error('Error loading widget catalog:', error);
        }

        const graph = buildContextGraph(entries, edges);

        if (includeDiagnostics) {
            const sourceCounts = new Map<string, number>();
            entries.forEach((entry) => {
                const source = entry.sourceType || 'unknown';
                sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
            });

            const typeCounts = new Map<string, number>();
            entries.forEach((entry) => {
                typeCounts.set(
                    entry.entryType,
                    (typeCounts.get(entry.entryType) || 0) + 1,
                );
            });

            return NextResponse.json({
                graph,
                diagnostics: {
                    entriesCount: entries.length,
                    edgesCount: edges.length,
                    nodesCount: graph.nodes.length,
                    sourceCounts: Object.fromEntries(sourceCounts),
                    typeCounts: Object.fromEntries(typeCounts),
                    sampleEntries: entries.slice(0, 5).map((e) => ({
                        entityId: e.entityId,
                        entryType: e.entryType,
                        label: e.label,
                        sourceType: e.sourceType,
                        sourceId: e.sourceId,
                    })),
                },
            });
        }

        return NextResponse.json(graph);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
