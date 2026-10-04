import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import {
    ingestContextNodes,
    ingestContextEdges,
} from '@/features/context/services/contextService';
import type {
    CanonicalContextNodeInput,
    CanonicalContextEdgeInput,
} from '@/features/context/types/schemas';

const ADAPTER_GRAPH_SOURCES = [
    'todos',
    'files',
    'calendar_events',
    'documents',
    'journals',
    'mood_logs',
    'habits',
    'recovery_records',
    'finance_records',
    'countdowns',
    'memory_decks',
    'collaboration_handoffs',
    'tracking_entries',
    'activity_events',
] as const;

interface SourceResult {
    source: string;
    status: 'loaded' | 'empty' | 'failed' | 'unavailable';
    recordsFound: number;
    nodesProduced: number;
    edgesProduced: number;
    failureReason?: string;
}

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const url = new URL(req.url);
        const persist = url.searchParams.get('persist') === 'true';

        registerCoreImportExportAdapters();

        const allNodes: CanonicalContextNodeInput[] = [];
        const allEdges: CanonicalContextEdgeInput[] = [];
        const sourceResults: SourceResult[] = [];

        for (const source of ADAPTER_GRAPH_SOURCES) {
            const result = await loadFromAdapter(supabase, userId, source);
            sourceResults.push(result);

            if (result.status === 'loaded') {
                const adapter = listAdapters().find(
                    (a) => a.sourceType === source,
                );
                if (adapter?.exportData) {
                    try {
                        const payload = await adapter.exportData(userId, {
                            limit: 1000,
                        });
                        const mapper = getContextMapper(source);
                        if (mapper) {
                            for (const row of payload.rows) {
                                const mapping = mapper(row);
                                if (mapping) {
                                    allNodes.push(...mapping.nodes);
                                    if (mapping.edges) {
                                        allEdges.push(...mapping.edges);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing ${source}:`, error);
                    }
                }
            }
        }

        // Also add widget catalog and instances
        try {
            const { getAllManifests } =
                await import('@/features/dashboard/runtime/widgetManifestRegistry');
            const { getWidgetMeta } =
                await import('@/features/context/lib/widgetContextMap');

            const manifests = getAllManifests().filter(
                (m: any) => m.widgetType !== 'context-diagram',
            );

            for (const manifest of manifests) {
                const meta = getWidgetMeta(manifest.widgetType as any);
                allNodes.push({
                    entityId: `widget-${manifest.widgetType}`,
                    type: 'widget',
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
                });
            }

            sourceResults.push({
                source: 'widget_catalog',
                status: 'loaded',
                recordsFound: manifests.length,
                nodesProduced: manifests.length,
                edgesProduced: 0,
            });
        } catch (error) {
            sourceResults.push({
                source: 'widget_catalog',
                status: 'failed',
                recordsFound: 0,
                nodesProduced: 0,
                edgesProduced: 0,
                failureReason:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }

        // Build graph from adapter data
        const graph = buildContextGraph(
            allNodes.map((node) => ({
                id: `adapter-${node.entityId}`,
                userId,
                entityId: node.entityId,
                entryType: node.type,
                label: node.label,
                summary: node.summary,
                data: node.data ?? {},
                tags: node.tags,
                sourceType: node.sourceType,
                sourceId: node.sourceId,
                sourceTable: node.sourceTable,
                sourceCollection: node.sourceCollection,
                createdBy: node.createdBy,
                createdByType: node.createdByType,
                confidence: node.confidence,
                status: node.status,
                visibility: node.visibility,
                permissions: node.permissions,
                lastObservedAt: new Date().toISOString(),
                lastVerifiedAt: node.lastVerifiedAt,
                metadata: node.metadata,
                linkedTo: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })),
            allEdges.map((edge) => {
                const edgeObj: any = {
                    id: `adapter-edge-${edge.fromEntityId}-${edge.toEntityId}-${edge.kind}`,
                    from: edge.fromEntityId,
                    to: edge.toEntityId,
                    kind: edge.kind,
                    weight: edge.weight,
                    confidence: edge.confidence,
                    sourceType: edge.sourceType,
                    sourceId: edge.sourceId,
                    createdBy: edge.createdBy,
                    createdByType: edge.createdByType,
                    metadata: edge.metadata,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                if (edge.label !== undefined && edge.label !== null) {
                    edgeObj.label = edge.label;
                }
                return edgeObj;
            }),
        );

        // Optionally persist to DB
        if (persist && allNodes.length > 0) {
            try {
                await ingestContextNodes(supabase, userId, allNodes);
                if (allEdges.length > 0) {
                    await ingestContextEdges(supabase, userId, allEdges);
                }
            } catch (error) {
                console.error('Error persisting adapter data:', error);
            }
        }

        return NextResponse.json({
            graph,
            sourceResults,
            summary: {
                totalSources: sourceResults.length,
                loadedSources: sourceResults.filter(
                    (s) => s.status === 'loaded',
                ).length,
                emptySources: sourceResults.filter((s) => s.status === 'empty')
                    .length,
                failedSources: sourceResults.filter(
                    (s) => s.status === 'failed',
                ).length,
                unavailableSources: sourceResults.filter(
                    (s) => s.status === 'unavailable',
                ).length,
                totalRecords: sourceResults.reduce(
                    (sum, s) => sum + s.recordsFound,
                    0,
                ),
                totalNodes: allNodes.length,
                totalEdges: allEdges.length,
            },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

async function loadFromAdapter(
    db: SupabaseClient,
    userId: string,
    source: string,
): Promise<SourceResult> {
    const adapter = listAdapters().find((a) => a.sourceType === source);
    if (!adapter?.exportData) {
        return {
            source,
            status: 'unavailable',
            recordsFound: 0,
            nodesProduced: 0,
            edgesProduced: 0,
            failureReason: 'Adapter not found or does not support export',
        };
    }

    try {
        const availability = await adapter.checkAvailability();
        if (!availability.available) {
            return {
                source,
                status: 'unavailable',
                recordsFound: 0,
                nodesProduced: 0,
                edgesProduced: 0,
                failureReason:
                    availability.message ?? 'Data source unavailable',
            };
        }

        const payload = await adapter.exportData(userId, { limit: 1000 });
        if (payload.rows.length === 0) {
            return {
                source,
                status: 'empty',
                recordsFound: 0,
                nodesProduced: 0,
                edgesProduced: 0,
            };
        }

        const mapper = getContextMapper(source);
        if (!mapper) {
            return {
                source,
                status: 'failed',
                recordsFound: payload.rows.length,
                nodesProduced: 0,
                edgesProduced: 0,
                failureReason: 'Context mapper not found',
            };
        }

        let nodesProduced = 0;
        let edgesProduced = 0;
        for (const row of payload.rows) {
            const mapping = mapper(row);
            if (mapping) {
                nodesProduced += mapping.nodes.length;
                edgesProduced += (mapping.edges ?? []).length;
            }
        }

        return {
            source,
            status: 'loaded',
            recordsFound: payload.rows.length,
            nodesProduced,
            edgesProduced,
        };
    } catch (error) {
        return {
            source,
            status: 'failed',
            recordsFound: 0,
            nodesProduced: 0,
            edgesProduced: 0,
            failureReason:
                error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
