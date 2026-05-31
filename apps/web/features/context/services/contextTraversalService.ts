import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ContextEdge,
    ContextEntry,
    ContextGraph,
} from '@/features/context/types/context';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import {
    listEdges,
    listEntries,
    normalizeEntityId,
} from '@/features/context/services/contextService';
import { getContextPermissions } from './contextPermissionsService';

export interface ContextTraversalFilters {
    maxDepth?: number;
    nodeTypes?: string[];
    edgeKinds?: string[];
    includeArchived?: boolean;
    includeStale?: boolean;
    sourceTypes?: string[];
    minConfidence?: number;
    limit?: number;
    sort?: 'relevance' | 'activity' | 'updatedAt';
    permissionScope?: string;
    direction?: 'inbound' | 'outbound' | 'both';
}

export async function getContextNode(
    db: SupabaseClient,
    userId: string,
    entityId: string,
): Promise<ContextEntry | null> {
    const nodes = await listContextNodes(db, userId, {
        limit: 1,
        includeArchived: true,
        includeStale: true,
    });
    return (
        nodes.find((node) => node.entityId === normalizeEntityId(entityId)) ??
        null
    );
}

export async function listContextNodes(
    db: SupabaseClient,
    userId: string,
    filters?: ContextTraversalFilters,
): Promise<ContextEntry[]> {
    const permissions = await getContextPermissions(db, userId);
    if (
        filters?.permissionScope === 'ai' &&
        !permissions.allowAIPersonalization
    )
        return [];
    const nodes = await listEntries(db, userId);
    return applyNodeFilters(nodes, filters).slice(0, filters?.limit ?? 200);
}

export async function getContextEdges(
    db: SupabaseClient,
    userId: string,
    filters?: ContextTraversalFilters & {
        fromEntityId?: string;
        toEntityId?: string;
    },
): Promise<ContextEdge[]> {
    const edgeFilters: {
        fromEntityId?: string;
        toEntityId?: string;
        kinds?: string[];
        minConfidence?: number;
    } = {};
    if (filters?.fromEntityId) edgeFilters.fromEntityId = filters.fromEntityId;
    if (filters?.toEntityId) edgeFilters.toEntityId = filters.toEntityId;
    if (filters?.edgeKinds) edgeFilters.kinds = filters.edgeKinds;
    if (filters?.minConfidence !== undefined)
        edgeFilters.minConfidence = filters.minConfidence;
    const edges = await listEdges(db, userId, edgeFilters);
    return edges.slice(0, filters?.limit ?? 500);
}

export async function getContextNeighborhood(
    db: SupabaseClient,
    userId: string,
    entityId: string,
    depth = 1,
    filters?: ContextTraversalFilters,
): Promise<ContextGraph> {
    return traverseContextGraph(db, userId, entityId, {
        ...filters,
        maxDepth: depth,
    });
}

export async function traverseContextGraph(
    db: SupabaseClient,
    userId: string,
    startEntityId: string,
    options?: ContextTraversalFilters,
): Promise<ContextGraph> {
    const allNodes = await listContextNodes(db, userId, {
        ...options,
        limit: 1000,
    });
    const allEdges = await getContextEdges(db, userId, {
        ...options,
        limit: 2000,
    });
    const nodeById = new Map(allNodes.map((node) => [node.entityId, node]));
    const seen = new Set<string>([normalizeEntityId(startEntityId)]);
    const frontier = [normalizeEntityId(startEntityId)];
    const maxDepth = options?.maxDepth ?? 2;
    const direction = options?.direction ?? 'both';
    const selectedEdges: ContextEdge[] = [];

    for (let currentDepth = 0; currentDepth < maxDepth; currentDepth++) {
        const next: string[] = [];
        for (const current of frontier.splice(0)) {
            for (const edge of allEdges) {
                const outbound =
                    direction !== 'inbound' && edge.from === current;
                const inbound = direction !== 'outbound' && edge.to === current;
                if (!outbound && !inbound) continue;
                const other = outbound ? edge.to : edge.from;
                selectedEdges.push(edge);
                if (!seen.has(other) && nodeById.has(other)) {
                    seen.add(other);
                    next.push(other);
                }
            }
        }
        frontier.push(...next);
    }

    const nodes = [...seen]
        .map((id) => nodeById.get(id))
        .filter(Boolean) as ContextEntry[];
    return buildContextGraph(nodes, selectedEdges);
}

export async function getRelatedContext(
    db: SupabaseClient,
    userId: string,
    entityId: string,
    options?: ContextTraversalFilters,
): Promise<ContextEntry[]> {
    const graph = await getContextNeighborhood(
        db,
        userId,
        entityId,
        options?.maxDepth ?? 1,
        options,
    );
    return graph.nodes.filter((node) => node.entityId !== entityId);
}

export async function getRecentlyActiveContext(
    db: SupabaseClient,
    userId: string,
    limit = 20,
): Promise<ContextEntry[]> {
    return listContextNodes(db, userId, { limit, sort: 'updatedAt' });
}

export async function getDisconnectedContext(
    db: SupabaseClient,
    userId: string,
): Promise<ContextEntry[]> {
    const nodes = await listContextNodes(db, userId, { limit: 1000 });
    const edges = await getContextEdges(db, userId, { limit: 2000 });
    const connected = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
    return nodes.filter((node) => !connected.has(node.entityId));
}

export async function getContextBySource(
    db: SupabaseClient,
    userId: string,
    sourceType: string,
    sourceId: string,
): Promise<ContextEntry | null> {
    const nodes = await listContextNodes(db, userId, {
        sourceTypes: [sourceType],
        includeArchived: true,
        includeStale: true,
        limit: 1000,
    });
    return nodes.find((node) => node.sourceId === sourceId) ?? null;
}

export async function rankContextForQuery(
    db: SupabaseClient,
    userId: string,
    query: string,
    options?: ContextTraversalFilters,
): Promise<ContextEntry[]> {
    const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
    const nodes = await listContextNodes(db, userId, {
        ...options,
        permissionScope: options?.permissionScope ?? 'ai',
        limit: 1000,
    });
    return nodes
        .map((node) => ({
            node,
            score:
                terms.filter((term) => searchableText(node).includes(term))
                    .length +
                (node.status === 'active' ? 0.25 : 0) +
                (node.confidence ?? 1),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, options?.limit ?? 30)
        .map((item) => item.node);
}

function applyNodeFilters(
    nodes: ContextEntry[],
    filters?: ContextTraversalFilters,
): ContextEntry[] {
    let result = nodes;
    if (!filters?.includeArchived)
        result = result.filter((node) => node.status !== 'archived');
    if (!filters?.includeStale)
        result = result.filter((node) => node.status !== 'stale');
    if (filters?.nodeTypes?.length)
        result = result.filter((node) =>
            filters.nodeTypes?.includes(node.entryType),
        );
    if (filters?.sourceTypes?.length)
        result = result.filter((node) =>
            filters.sourceTypes?.includes(node.sourceType ?? 'manual'),
        );
    if (filters?.minConfidence !== undefined)
        result = result.filter(
            (node) => (node.confidence ?? 1) >= filters.minConfidence!,
        );
    if (filters?.permissionScope)
        result = result.filter((node) =>
            (node.permissions ?? ['private']).includes(
                filters.permissionScope!,
            ),
        );
    return result.sort((a, b) => {
        if (filters?.sort === 'relevance') return 0;
        return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });
}

function searchableText(node: ContextEntry): string {
    return [
        node.label,
        node.summary,
        node.entryType,
        node.sourceType,
        ...(node.tags ?? []),
        ...Object.values(node.data ?? {}).map(String),
    ]
        .join(' ')
        .toLowerCase();
}
