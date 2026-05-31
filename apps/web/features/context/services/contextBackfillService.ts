import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import {
    getContextMapper,
    type AdapterContextMapping,
} from '@/features/import-export/lib/contextMapper';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import { getAllManifests } from '@/features/dashboard/runtime/widgetManifestRegistry';
import { getWidgetMeta } from '@/features/context/lib/widgetContextMap';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type { MappedRow } from '@/features/import-export/types/importExport';
import { captureCategoryForSource } from '@/features/context/services/contextPermissionsService';
import {
    ingestContextEdges,
    ingestContextNodes,
    listEdges,
    listEntries,
    normalizeEntityId,
} from '@/features/context/services/contextService';
import type {
    CanonicalContextEdgeInput,
    CanonicalContextNodeInput,
} from '@/features/context/types/schemas';
import type { ContextPermissionCategory } from '@/features/context/types/schemas';

export interface ContextBackfillSourceSummary {
    source: string;
    permissionCategory: ContextPermissionCategory;
    recordsFound: number;
    nodesAttempted: number;
    nodesCreated: number;
    nodesUpdated: number;
    nodesSkipped: number;
    edgesAttempted: number;
    edgesCreated: number;
    edgesUpdated: number;
    edgesSkipped: number;
    errors: string[];
    skippedReason?: string;
}

export interface ContextBackfillSummary {
    startedAt: string;
    completedAt: string;
    sources: ContextBackfillSourceSummary[];
    totals: {
        sourcesAttempted: number;
        sourcesSkipped: number;
        recordsFound: number;
        nodesAttempted: number;
        nodesCreated: number;
        nodesUpdated: number;
        nodesSkipped: number;
        edgesAttempted: number;
        edgesCreated: number;
        edgesUpdated: number;
        edgesSkipped: number;
        errors: number;
    };
}

export const ADAPTER_BACKFILL_SOURCES = [
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

export const MANUAL_BACKFILL_SOURCES = [
    'widget_catalog',
    'widget_instances',
    'automation_configs',
    'automation_runs',
    'email_actions',
    'file_text_extractions',
    'job_artifacts',
] as const;

const BACKFILL_LIMIT = 750;

export async function runContextBackfill(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSummary> {
    registerCoreImportExportAdapters();
    const startedAt = new Date().toISOString();
    const sources: ContextBackfillSourceSummary[] = [];

    for (const source of ADAPTER_BACKFILL_SOURCES) {
        sources.push(await backfillAdapterSource(db, userId, source));
    }

    sources.push(await backfillWidgetCatalog(db, userId));
    sources.push(await backfillWidgetInstances(db, userId));
    sources.push(await backfillAutomationConfigs(db, userId));
    sources.push(await backfillAutomationRuns(db, userId));
    sources.push(await backfillEmailActions(db, userId));
    sources.push(await backfillFileTextExtractions(db, userId));
    sources.push(await backfillJobArtifacts(db, userId));

    const totals = sources.reduce(
        (acc, source) => {
            acc.sourcesAttempted += source.skippedReason ? 0 : 1;
            acc.sourcesSkipped += source.skippedReason ? 1 : 0;
            acc.recordsFound += source.recordsFound;
            acc.nodesAttempted += source.nodesAttempted;
            acc.nodesCreated += source.nodesCreated;
            acc.nodesUpdated += source.nodesUpdated;
            acc.nodesSkipped += source.nodesSkipped;
            acc.edgesAttempted += source.edgesAttempted;
            acc.edgesCreated += source.edgesCreated;
            acc.edgesUpdated += source.edgesUpdated;
            acc.edgesSkipped += source.edgesSkipped;
            acc.errors += source.errors.length;
            return acc;
        },
        {
            sourcesAttempted: 0,
            sourcesSkipped: 0,
            recordsFound: 0,
            nodesAttempted: 0,
            nodesCreated: 0,
            nodesUpdated: 0,
            nodesSkipped: 0,
            edgesAttempted: 0,
            edgesCreated: 0,
            edgesUpdated: 0,
            edgesSkipped: 0,
            errors: 0,
        },
    );

    return {
        startedAt,
        completedAt: new Date().toISOString(),
        sources,
        totals,
    };
}

export async function backfillContextRowsForSource(
    db: SupabaseClient,
    userId: string,
    source: string,
    rows: MappedRow[],
): Promise<ContextBackfillSourceSummary> {
    const mapper = getContextMapper(source);
    if (!mapper) {
        return {
            ...emptySourceSummary(source),
            skippedReason: 'missing context mapper',
        };
    }
    return ingestMappedRows(db, userId, source, rows, mapper);
}

async function backfillWidgetCatalog(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'widget_catalog';
    const manifests = getAllManifests().filter(
        (manifest) => manifest.widgetType !== 'context-diagram',
    );
    const nodes = manifests.map((manifest) => {
        const meta = getWidgetMeta(manifest.widgetType as WidgetType);
        return {
            entityId: `widget-${manifest.widgetType}`,
            type: 'widget' as const,
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
            sourceType: source,
            sourceId: manifest.widgetType,
            sourceCollection: 'dashboard_runtime_manifests',
            createdByType: 'system' as const,
            permissions: [
                'private' as const,
                'ai' as const,
                'cross_widget' as const,
            ],
        };
    });
    return ingestMappedContext(db, userId, source, manifests.length, nodes, []);
}

async function backfillWidgetInstances(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'widget_instances';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows
        .filter(
            (row) =>
                row.widget_id !== 'context-diagram' &&
                row.feature_id !== 'context-diagram',
        )
        .map((row) => {
            const widgetType = String(row.feature_id ?? row.widget_id);
            const meta = getWidgetMeta(widgetType as WidgetType);
            return {
                entityId: `widget_instance:${String(row.id)}`,
                type: 'widget' as const,
                label: `${meta.label || widgetType} instance`,
                summary: `Widget instance ${String(row.active === false ? 'inactive' : 'active')}`,
                data: {
                    widgetId: row.widget_id,
                    widgetType,
                    active: row.active,
                    config: row.config,
                },
                tags: ['widget', 'instance', widgetType],
                sourceType: source,
                sourceId: String(row.id),
                sourceTable: source,
                createdByType: 'system' as const,
                permissions: [
                    'private' as const,
                    'ai' as const,
                    'cross_widget' as const,
                ],
            };
        });
    const edges = nodes.map((node) => ({
        fromEntityId: node.entityId,
        toEntityId: `widget-${String(node.data.widgetType)}`,
        kind: 'belongs_to' as const,
        label: 'instance of widget',
        sourceType: source,
        sourceId: node.sourceId,
        createdByType: 'system' as const,
    }));
    return ingestMappedContext(
        db,
        userId,
        source,
        rows.rows.length,
        nodes,
        edges,
    );
}

async function backfillAdapterSource(
    db: SupabaseClient,
    userId: string,
    source: string,
): Promise<ContextBackfillSourceSummary> {
    const base = emptySourceSummary(source);
    const adapter = listAdapters().find((item) => item.sourceType === source);
    if (!adapter?.exportData) {
        return {
            ...base,
            skippedReason: 'missing adapter export support',
        };
    }
    const mapper = getContextMapper(source);
    if (!mapper) {
        return {
            ...base,
            skippedReason: 'missing context mapper',
        };
    }

    try {
        const availability = await adapter.checkAvailability();
        if (!availability.available) {
            return {
                ...base,
                skippedReason:
                    availability.message ?? 'data source unavailable',
            };
        }
        const payload = await adapter.exportData(userId, {
            limit: BACKFILL_LIMIT,
        });
        return ingestMappedRows(db, userId, source, payload.rows, mapper);
    } catch (error) {
        return {
            ...base,
            errors: [errorMessage(error)],
        };
    }
}

async function ingestMappedRows(
    db: SupabaseClient,
    userId: string,
    source: string,
    rows: MappedRow[],
    mapper: (row: MappedRow) => AdapterContextMapping | null,
): Promise<ContextBackfillSourceSummary> {
    const mapped = rows.map(mapper).filter(Boolean) as AdapterContextMapping[];
    const nodes = mapped.flatMap((item) => item.nodes);
    const edges = mapped.flatMap((item) => item.edges ?? []);
    return ingestMappedContext(db, userId, source, rows.length, nodes, edges);
}

async function ingestMappedContext(
    db: SupabaseClient,
    userId: string,
    source: string,
    recordsFound: number,
    nodes: CanonicalContextNodeInput[],
    edges: CanonicalContextEdgeInput[],
): Promise<ContextBackfillSourceSummary> {
    const base = emptySourceSummary(source);
    const existingNodeIds = await getExistingEntityIds(
        db,
        userId,
        nodes.map((node) => normalizeEntityId(node.entityId)),
    );
    const existingEdgeKeys = await getExistingEdgeKeys(db, userId, edges);
    const persistedNodes = await ingestContextNodes(db, userId, nodes);
    const persistedEdges = await ingestContextEdges(db, userId, edges);
    const persistedNodeIds = new Set(
        persistedNodes.map((node) => node.entityId),
    );
    const persistedEdgeKeys = new Set(
        persistedEdges.map((edge) =>
            edgeKeyFromEdge({
                from: edge.from,
                to: edge.to,
                kind: edge.kind ?? 'explicit',
                sourceType: edge.sourceType,
                sourceId: edge.sourceId,
            }),
        ),
    );
    let nodesCreated = 0;
    let nodesUpdated = 0;
    for (const id of persistedNodeIds) {
        if (existingNodeIds.has(id)) nodesUpdated += 1;
        else nodesCreated += 1;
    }
    let edgesCreated = 0;
    let edgesUpdated = 0;
    for (const key of persistedEdgeKeys) {
        if (existingEdgeKeys.has(key)) edgesUpdated += 1;
        else edgesCreated += 1;
    }
    return {
        ...base,
        recordsFound,
        nodesAttempted: nodes.length,
        nodesCreated,
        nodesUpdated,
        nodesSkipped: Math.max(0, nodes.length - persistedNodes.length),
        edgesAttempted: edges.length,
        edgesCreated,
        edgesUpdated,
        edgesSkipped: Math.max(0, edges.length - persistedEdges.length),
    };
}

async function backfillAutomationConfigs(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'automation_configs';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows.map((row) => ({
        entityId: `automation:${String(row.id)}`,
        type: 'automation' as const,
        label: String(row.name ?? row.title ?? 'Automation'),
        summary: `Trigger ${String(row.trigger_type ?? 'unknown')} · ${String(row.state ?? 'unknown')}`,
        data: {
            triggerType: row.trigger_type,
            conditionTypes: row.condition_types,
            actionTypes: row.action_types,
            state: row.state,
            schedule: row.schedule,
            serviceRequirements: row.service_requirements,
        },
        tags: ['automation', String(row.state ?? '')].filter(Boolean),
        sourceType: source,
        sourceId: String(row.id),
        sourceTable: source,
        createdByType: 'system' as const,
        permissions: ['private' as const, 'ai' as const, 'automation' as const],
    }));
    return ingestMappedContext(db, userId, source, rows.rows.length, nodes, []);
}

async function backfillAutomationRuns(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'automation_runs';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows.map((row) => ({
        entityId: `automation_run:${String(row.id)}`,
        type: 'automation_run' as const,
        label: `Automation run ${String(row.status ?? 'unknown')}`,
        summary: `Run status: ${String(row.status ?? 'unknown')}`,
        data: {
            automationConfigId: row.automation_config_id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            result: row.result,
        },
        tags: ['automation', 'run', String(row.status ?? '')].filter(Boolean),
        sourceType: source,
        sourceId: String(row.id),
        sourceTable: source,
        createdByType: 'system' as const,
        permissions: ['private' as const, 'ai' as const, 'automation' as const],
    }));
    const edges = rows.rows
        .filter((row) => row.automation_config_id)
        .map((row) => ({
            fromEntityId: `automation_run:${String(row.id)}`,
            toEntityId: `automation:${String(row.automation_config_id)}`,
            kind: 'triggered_by' as const,
            label: 'run triggered by automation',
            sourceType: source,
            sourceId: String(row.id),
            createdByType: 'system' as const,
        }));
    return ingestMappedContext(
        db,
        userId,
        source,
        rows.rows.length,
        nodes,
        edges,
    );
}

async function backfillEmailActions(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'email_actions';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows.map((row) => {
        const title = String(
            row.title ??
                row.subject ??
                row.action_text ??
                row.description ??
                'Email action',
        );
        const emailId = String(row.email_id ?? row.message_id ?? row.id);
        return {
            entityId: `agent_action:email:${String(row.id)}`,
            type: 'agent_action' as const,
            label: title,
            summary: String(row.description ?? row.summary ?? title).slice(
                0,
                280,
            ),
            data: {
                emailId,
                actionType: row.action_type ?? row.type,
                status: row.status,
                dueDate: row.due_date,
                provider: row.provider ?? 'email',
            },
            tags: ['email', 'action', String(row.action_type ?? '')].filter(
                Boolean,
            ),
            sourceType: source,
            sourceId: String(row.id),
            sourceTable: source,
            createdByType: 'agent' as const,
            permissions: [
                'private' as const,
                'ai' as const,
                'cross_widget' as const,
            ],
        };
    });
    const edges = rows.rows
        .filter((row) => row.email_id || row.message_id)
        .map((row) => ({
            fromEntityId: `agent_action:email:${String(row.id)}`,
            toEntityId: `email:${String(row.email_id ?? row.message_id)}`,
            kind: 'derived_from' as const,
            label: 'extracted from email',
            sourceType: source,
            sourceId: String(row.id),
            createdByType: 'agent' as const,
        }));
    return ingestMappedContext(
        db,
        userId,
        source,
        rows.rows.length,
        nodes,
        edges,
    );
}

async function backfillFileTextExtractions(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'file_text_extractions';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows.map((row) => ({
        entityId: `artifact:extraction:${String(row.id)}`,
        type: 'artifact' as const,
        label: `Text extraction ${String(row.id).slice(0, 8)}`,
        summary: String(row.extracted_text ?? row.summary ?? '').slice(0, 280),
        data: {
            fileId: row.file_id,
            conversionId: row.conversion_id,
            textFormat: row.text_format,
            characterCount: row.character_count,
            tokenEstimate: row.token_estimate,
            status: row.extraction_status,
        },
        tags: [
            'artifact',
            'text-extraction',
            String(row.text_format ?? ''),
        ].filter(Boolean),
        sourceType: source,
        sourceId: String(row.id),
        sourceTable: source,
        createdByType: 'system' as const,
        permissions: [
            'private' as const,
            'ai' as const,
            'cross_widget' as const,
        ],
    }));
    const edges = rows.rows
        .filter((row) => row.file_id)
        .map((row) => ({
            fromEntityId: `artifact:extraction:${String(row.id)}`,
            toEntityId: `file:${String(row.file_id)}`,
            kind: 'derived_from' as const,
            label: 'extracted from file',
            sourceType: source,
            sourceId: String(row.id),
            createdByType: 'system' as const,
        }));
    return ingestMappedContext(
        db,
        userId,
        source,
        rows.rows.length,
        nodes,
        edges,
    );
}

async function backfillJobArtifacts(
    db: SupabaseClient,
    userId: string,
): Promise<ContextBackfillSourceSummary> {
    const source = 'job_artifacts';
    const rows = await selectUserRows(db, source, userId, BACKFILL_LIMIT);
    if (!rows.ok) return skippedOrErroredSource(source, rows);
    const nodes = rows.rows.map((row) => ({
        entityId: `artifact:job:${String(row.id)}`,
        type: 'artifact' as const,
        label: `Job artifact ${String(row.artifact_type ?? 'artifact')}`,
        summary: String(row.storage_path ?? row.artifact_type ?? '').slice(
            0,
            280,
        ),
        data: {
            jobId: row.job_id,
            artifactType: row.artifact_type,
            storagePath: row.storage_path,
            metadata: row.metadata,
        },
        tags: ['artifact', 'job', String(row.artifact_type ?? '')].filter(
            Boolean,
        ),
        sourceType: source,
        sourceId: String(row.id),
        sourceTable: source,
        createdByType: 'system' as const,
        permissions: [
            'private' as const,
            'ai' as const,
            'cross_widget' as const,
        ],
    }));
    const edges = rows.rows
        .filter((row) => row.job_id)
        .map((row) => ({
            fromEntityId: `artifact:job:${String(row.id)}`,
            toEntityId: `agent_action:job:${String(row.job_id)}`,
            kind: 'produced_by' as const,
            label: 'produced by job',
            sourceType: source,
            sourceId: String(row.id),
            createdByType: 'system' as const,
        }));
    return ingestMappedContext(
        db,
        userId,
        source,
        rows.rows.length,
        nodes,
        edges,
    );
}

async function selectUserRows(
    db: SupabaseClient,
    table: string,
    userId: string,
    limit: number,
): Promise<
    | { ok: true; rows: Record<string, any>[] }
    | { ok: false; skippedReason?: string; error?: string }
> {
    const { data, error } = await (db as any)
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .limit(limit);
    if (error) {
        if (isMissingTableError(error)) {
            return { ok: false, skippedReason: `${table} table not found` };
        }
        return { ok: false, error: error.message };
    }
    return { ok: true, rows: data ?? [] };
}

function skippedOrErroredSource(
    source: string,
    result: { ok: false; skippedReason?: string; error?: string },
): ContextBackfillSourceSummary {
    const summary: ContextBackfillSourceSummary = {
        ...emptySourceSummary(source),
        errors: result.error ? [result.error] : [],
    };
    if (result.skippedReason) summary.skippedReason = result.skippedReason;
    return summary;
}

async function getExistingEntityIds(
    db: SupabaseClient,
    userId: string,
    entityIds: string[],
): Promise<Set<string>> {
    const unique = [...new Set(entityIds)].filter(Boolean);
    if (unique.length === 0) return new Set();
    const { data, error } = await (db as any)
        .from('context_entries')
        .select('entity_id')
        .eq('user_id', userId)
        .in('entity_id', unique);
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((row: any) => String(row.entity_id)));
}

async function getExistingEdgeKeys(
    db: SupabaseClient,
    userId: string,
    edges: CanonicalContextEdgeInput[],
): Promise<Set<string>> {
    const sourceTypes = [
        ...new Set(edges.map((edge) => edge.sourceType ?? 'manual')),
    ];
    if (edges.length === 0) return new Set();
    let query = (db as any)
        .from('context_edges')
        .select('from_entity_id,to_entity_id,kind,source_type,source_id')
        .eq('user_id', userId);
    if (sourceTypes.length) query = query.in('source_type', sourceTypes);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map(edgeKeyFromRow));
}

function edgeKeyFromEdge(edge: {
    from: string;
    to: string;
    kind: string;
    sourceType?: string | null | undefined;
    sourceId?: string | null | undefined;
}) {
    return [
        normalizeEntityId(edge.from),
        normalizeEntityId(edge.to),
        edge.kind,
        edge.sourceType ?? 'manual',
        edge.sourceId ?? '',
    ].join('|');
}

function edgeKeyFromRow(row: Record<string, any>) {
    return [
        normalizeEntityId(String(row.from_entity_id)),
        normalizeEntityId(String(row.to_entity_id)),
        String(row.kind),
        String(row.source_type ?? 'manual'),
        String(row.source_id ?? ''),
    ].join('|');
}

function emptySourceSummary(source: string): ContextBackfillSourceSummary {
    return {
        source,
        permissionCategory: captureCategoryForSource(source),
        recordsFound: 0,
        nodesAttempted: 0,
        nodesCreated: 0,
        nodesUpdated: 0,
        nodesSkipped: 0,
        edgesAttempted: 0,
        edgesCreated: 0,
        edgesUpdated: 0,
        edgesSkipped: 0,
        errors: [],
    };
}

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
}
