import type { SupabaseClient } from '@supabase/supabase-js';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import {
    ADAPTER_BACKFILL_SOURCES,
    MANUAL_BACKFILL_SOURCES,
} from '@/features/context/services/contextBackfillService';
import {
    CONTEXT_COVERAGE_REGISTRY,
    getContextCoverageSummary,
    type ContextCoverageEntry,
} from '@/features/context/lib/contextCoverageRegistry';
import {
    listEdges,
    listEntries,
} from '@/features/context/services/contextService';
import type {
    ContextEdge,
    ContextEntry,
} from '@/features/context/types/context';

export type RuntimeContextCoverageStatus =
    | 'healthy'
    | 'wired_but_no_data'
    | 'declared_only'
    | 'mapped_not_called'
    | 'missing_mapper'
    | 'missing_producer'
    | 'missing_consumer'
    | 'blocked_by_migration'
    | 'not_applicable';

export interface RuntimeContextCoverageEntry extends Omit<
    ContextCoverageEntry,
    'status'
> {
    adapterStatus:
        | 'mapped'
        | 'missing_mapper'
        | 'no_adapter'
        | 'not_applicable';
    producerStatus: 'wired' | 'missing_producer' | 'not_applicable';
    consumerStatus: 'wired' | 'missing_consumer' | 'not_applicable';
    actualNodeCount: number;
    actualEdgeCount: number;
    lastObservedAt: string | null;
    backfillSupported: boolean;
    status: RuntimeContextCoverageStatus;
}

export interface ContextCoverageReport {
    summary: ReturnType<typeof getContextCoverageSummary> & {
        totalNodes: number;
        totalEdges: number;
        nodeCountsByType: Record<string, number>;
        sourceCountsBySourceType: Record<string, number>;
        edgeCountsByKind: Record<string, number>;
        lastObservedAt: string | null;
    };
    features: RuntimeContextCoverageEntry[];
}

export async function getRuntimeContextCoverageReport(
    db: SupabaseClient,
    userId: string,
): Promise<ContextCoverageReport> {
    registerCoreImportExportAdapters();
    const [entries, edges] = await Promise.all([
        listEntries(db, userId, { limit: 5000 }),
        listEdges(db, userId),
    ]);
    const nodeCountsByType = countBy(entries, (entry) => entry.entryType);
    const sourceCountsBySourceType = countBy(
        entries,
        (entry) => entry.sourceType ?? 'manual',
    );
    const edgeCountsByKind = countBy(edges, (edge) => edge.kind ?? 'explicit');
    const lastObservedAt = maxIso(
        entries.map((entry) => entry.lastObservedAt ?? entry.updatedAt),
    );
    const adapterSources = new Set(
        listAdapters().map((item) => item.sourceType),
    );
    const backfillSources = new Set<string>([
        ...ADAPTER_BACKFILL_SOURCES,
        ...MANUAL_BACKFILL_SOURCES,
    ]);

    const features = CONTEXT_COVERAGE_REGISTRY.map((entry) => {
        const sourceTypes = sourceTypesForEntry(entry);
        const actualNodeCount = entries.filter((node) =>
            nodeMatchesCoverage(node, entry, sourceTypes),
        ).length;
        const actualEdgeCount = edges.filter((edge) =>
            edgeMatchesCoverage(edge, entry, sourceTypes),
        ).length;
        const lastFeatureObservedAt = maxIso(
            entries
                .filter((node) => nodeMatchesCoverage(node, entry, sourceTypes))
                .map((node) => node.lastObservedAt ?? node.updatedAt),
        );
        const adapterStatus = adapterStatusForEntry(
            entry,
            sourceTypes,
            adapterSources,
        );
        const producerStatus = entry.producesContext
            ? 'wired'
            : 'not_applicable';
        const consumerStatus = entry.consumesContext
            ? 'wired'
            : 'not_applicable';
        const backfillSupported = sourceTypes.some((source) =>
            backfillSources.has(source),
        );
        return {
            ...entry,
            adapterStatus,
            producerStatus,
            consumerStatus,
            actualNodeCount,
            actualEdgeCount,
            lastObservedAt: lastFeatureObservedAt,
            backfillSupported,
            status: runtimeStatus({
                entry,
                actualNodeCount,
                adapterStatus,
                backfillSupported,
            }),
        } satisfies RuntimeContextCoverageEntry;
    });

    return {
        summary: {
            ...getContextCoverageSummary(),
            totalNodes: entries.length,
            totalEdges: edges.length,
            nodeCountsByType,
            sourceCountsBySourceType,
            edgeCountsByKind,
            lastObservedAt,
        },
        features,
    };
}

function runtimeStatus(input: {
    entry: ContextCoverageEntry;
    actualNodeCount: number;
    adapterStatus: RuntimeContextCoverageEntry['adapterStatus'];
    backfillSupported: boolean;
}): RuntimeContextCoverageStatus {
    if (!input.entry.producesContext && !input.entry.consumesContext) {
        return 'not_applicable';
    }
    if (input.actualNodeCount > 0) return 'healthy';
    if (input.adapterStatus === 'missing_mapper') return 'missing_mapper';
    if (input.entry.widgetManifestDeclared && !input.backfillSupported) {
        return 'declared_only';
    }
    if (input.backfillSupported || input.adapterStatus === 'mapped') {
        return 'wired_but_no_data';
    }
    if (input.entry.producesContext) return 'missing_producer';
    if (input.entry.consumesContext) return 'missing_consumer';
    return 'not_applicable';
}

function sourceTypesForEntry(entry: ContextCoverageEntry): string[] {
    const explicit = entry.adapterSourceType
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    if (explicit?.length) return explicit;
    return entry.primaryDataSource
        .split(',')
        .map((item) => item.trim())
        .filter((item) => /^[a-z0-9_]+$/.test(item));
}

function nodeMatchesCoverage(
    node: ContextEntry,
    entry: ContextCoverageEntry,
    sourceTypes: string[],
) {
    return (
        entry.producedNodeTypes.includes(node.entryType) ||
        (node.sourceType ? sourceTypes.includes(node.sourceType) : false)
    );
}

function edgeMatchesCoverage(
    edge: ContextEdge,
    entry: ContextCoverageEntry,
    sourceTypes: string[],
) {
    return (
        entry.producedEdgeKinds.includes(edge.kind ?? 'explicit') ||
        (edge.sourceType ? sourceTypes.includes(edge.sourceType) : false)
    );
}

function adapterStatusForEntry(
    entry: ContextCoverageEntry,
    sourceTypes: string[],
    adapterSources: Set<string>,
): RuntimeContextCoverageEntry['adapterStatus'] {
    if (!entry.producesContext) return 'not_applicable';
    if (sourceTypes.length === 0) return 'no_adapter';
    const adapterBacked = sourceTypes.filter((source) =>
        adapterSources.has(source),
    );
    if (adapterBacked.length === 0) return 'no_adapter';
    return adapterBacked.every((source) => getContextMapper(source))
        ? 'mapped'
        : 'missing_mapper';
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
    return items.reduce<Record<string, number>>((acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
}

function maxIso(values: Array<string | null | undefined>) {
    return (
        values
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => b.localeCompare(a))[0] ?? null
    );
}
