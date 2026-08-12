import type {
    ContextEdge,
    ContextEntry,
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';
import type { CanonicalContextEdge } from '@/features/context/types/schemas';
import { getWidgetManifest } from '@/features/dashboard/runtime/widgetManifestRegistry';
import {
    LAYER_ORDER,
    getEntryLayer,
    resolveWidgetType,
} from '@/features/context/lib/contextLayers';

type EdgeKind = CanonicalContextEdge['kind'];

export const CANVAS_CX = 500;
export const CANVAS_CY = 380;
const CLUSTER_R = 205;
const NODE_GAP = 96;

function radialPoint(
    cx: number,
    cy: number,
    r: number,
    index: number,
    total: number,
    offset = 0,
): { x: number; y: number } {
    const angle =
        offset + (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function buildContextGraph(
    entries: ContextEntry[],
    persistedEdges: ContextEdge[] = [],
): ContextGraph {
    const uniqueEntries = dedupeEntries(entries);
    const nodes = layoutNodes(uniqueEntries);
    const nodeMap = new Map(nodes.map((node) => [node.entityId, node]));
    const edges: ContextEdge[] = [];

    const pushEdge = (edge: ContextEdge) => {
        if (edge.from === edge.to) return;
        if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) return;
        const reverseDuplicate =
            edge.kind !== 'explicit' &&
            edges.some(
                (item) =>
                    item.kind === edge.kind &&
                    item.from === edge.to &&
                    item.to === edge.from,
            );
        const duplicate = edges.some(
            (item) =>
                item.kind === edge.kind &&
                item.from === edge.from &&
                item.to === edge.to,
        );
        if (!duplicate && !reverseDuplicate) edges.push(edge);
    };

    persistedEdges.forEach((edge) =>
        pushEdge({
            ...edge,
            kind: edge.kind ?? 'explicit',
            weight: edge.weight ?? 3,
            confidence: edge.confidence ?? 1,
        }),
    );

    const profileId = uniqueEntries.find(
        (entry) => entry.entryType === 'profile',
    )?.entityId;

    uniqueEntries.forEach((entry) => {
        entry.linkedTo.forEach((linkedId) => {
            const linkedEntry = nodeMap.get(linkedId);
            pushEdge({
                from: linkedId,
                to: entry.entityId,
                label: 'linked',
                kind: linkedEntry ? inferLinkKind(linkedEntry, entry) : 'relates_to',
                weight: 4,
            });
        });
    });

    if (profileId) {
        uniqueEntries
            .filter(
                (entry) =>
                    entry.entityId !== profileId &&
                    (entry.entryType === 'goal' ||
                        entry.entryType === 'integration' ||
                        (entry.entryType === 'widget' &&
                            entry.linkedTo.length === 0)),
            )
            .forEach((entry) => {
                pushEdge({
                    from: entry.entityId,
                    to: profileId,
                    label:
                        entry.entryType === 'widget'
                            ? 'workspace'
                            : entry.entryType,
                    kind: 'belongs_to',
                    weight: entry.entryType === 'widget' ? 2 : 3,
                });
            });
    }

    inferManifestEdges(uniqueEntries).forEach(pushEdge);

    const coveredPairs = new Set(
        edges.map((edge) => pairKey(edge.from, edge.to)),
    );
    inferLegacyEdges(
        uniqueEntries,
        persistedEdges.length > 0,
        coveredPairs,
    ).forEach(pushEdge);

    const connectionCounts = new Map<string, number>();
    edges.forEach((edge) => {
        connectionCounts.set(
            edge.from,
            (connectionCounts.get(edge.from) ?? 0) + 1,
        );
        connectionCounts.set(edge.to, (connectionCounts.get(edge.to) ?? 0) + 1);
    });

    return {
        nodes: nodes.map((node) => ({
            ...node,
            connectionCount: connectionCounts.get(node.entityId) ?? 0,
            activityScore: activityScore(node.updatedAt),
        })),
        edges,
    };
}

function dedupeEntries(entries: ContextEntry[]) {
    const byEntityId = new Map<string, ContextEntry>();

    entries.forEach((entry) => {
        const existing = byEntityId.get(entry.entityId);
        if (!existing) {
            byEntityId.set(entry.entityId, entry);
            return;
        }

        const existingUpdated = new Date(existing.updatedAt).getTime();
        const entryUpdated = new Date(entry.updatedAt).getTime();
        const newest = entryUpdated >= existingUpdated ? entry : existing;
        byEntityId.set(entry.entityId, {
            ...newest,
            linkedTo: [...new Set([...existing.linkedTo, ...entry.linkedTo])],
            data: { ...existing.data, ...entry.data, ...newest.data },
        });
    });

    return [...byEntityId.values()];
}

function layoutNodes(entries: ContextEntry[]): ContextNode[] {
    const profile = entries.find((entry) => entry.entryType === 'profile');
    const groups = new Map<string, ContextEntry[]>();

    entries
        .filter((entry) => entry.entryType !== 'profile')
        .forEach((entry) => {
            const group = nodeGroup(entry);
            groups.set(group, [...(groups.get(group) ?? []), entry]);
        });

    const groupEntries = [...groups.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
    );
    const nodes: ContextNode[] = [];
    if (profile) nodes.push({ ...profile, x: CANVAS_CX, y: CANVAS_CY });

    groupEntries.forEach(([, groupNodes], groupIndex) => {
        const center = radialPoint(
            CANVAS_CX,
            CANVAS_CY,
            CLUSTER_R,
            groupIndex,
            groupEntries.length,
            Math.PI / 8,
        );
        const columns = Math.ceil(Math.sqrt(groupNodes.length));
        const rows = Math.ceil(groupNodes.length / columns);
        groupNodes.forEach((entry, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            nodes.push({
                ...entry,
                x: center.x + col * NODE_GAP - ((columns - 1) * NODE_GAP) / 2,
                y: center.y + row * NODE_GAP - ((rows - 1) * NODE_GAP) / 2,
            });
        });
    });

    return nodes;
}

function nodeGroup(entry: ContextEntry) {
    if (entry.entryType !== 'widget') return entry.entryType;
    const category = String(entry.data.category ?? '').trim();
    return category ? `widget:${category}` : 'widget';
}

// 'Galaxy' layout: root at center, one hub per layer on an intermediate
// ring 90 degrees apart, and each layer's nodes packed into a 70-degree arc
// centered on its hub (matching the 90-degree hub spacing with a 10-degree
// gap on each side to the neighboring layer). Layers with more than
// GALAXY_MAX_PER_RING nodes spill onto additional, wider rings rather than
// crowding one arc.
export const GALAXY_LAYER_RING_R = 150;
const GALAXY_NODE_RING_BASE = 340;
const GALAXY_RING_STEP = 100;
const GALAXY_MAX_PER_RING = 6;
const GALAXY_ARC_WIDTH = (70 * Math.PI) / 180;

export function galaxyHubAngle(layerIndex: number): number {
    return -Math.PI / 2 + layerIndex * (Math.PI / 2);
}

export function galaxyHubPosition(layerIndex: number): { x: number; y: number } {
    const angle = galaxyHubAngle(layerIndex);
    return {
        x: CANVAS_CX + GALAXY_LAYER_RING_R * Math.cos(angle),
        y: CANVAS_CY + GALAXY_LAYER_RING_R * Math.sin(angle),
    };
}

export function layoutGalaxy(graph: ContextGraph): ContextGraph {
    const nodesByLayer = new Map<string, ContextNode[]>();
    const positioned = new Map<string, { x: number; y: number }>();

    graph.nodes.forEach((node) => {
        const layer = getEntryLayer(node);
        if (layer === 'root') {
            positioned.set(node.entityId, { x: CANVAS_CX, y: CANVAS_CY });
            return;
        }
        nodesByLayer.set(layer, [...(nodesByLayer.get(layer) ?? []), node]);
    });

    LAYER_ORDER.forEach((layer, layerIndex) => {
        const nodes = [...(nodesByLayer.get(layer) ?? [])].sort((a, b) =>
            nodeGroup(a).localeCompare(nodeGroup(b)),
        );
        const hubAngle = galaxyHubAngle(layerIndex);
        const startAngle = hubAngle - GALAXY_ARC_WIDTH / 2;

        nodes.forEach((node, index) => {
            const ringIndex = Math.floor(index / GALAXY_MAX_PER_RING);
            const ringStart = ringIndex * GALAXY_MAX_PER_RING;
            const ringCount = Math.min(
                GALAXY_MAX_PER_RING,
                nodes.length - ringStart,
            );
            const indexInRing = index - ringStart;
            const radius = GALAXY_NODE_RING_BASE + ringIndex * GALAXY_RING_STEP;
            const angle =
                ringCount > 1
                    ? startAngle +
                      (GALAXY_ARC_WIDTH * indexInRing) / (ringCount - 1)
                    : hubAngle;
            positioned.set(node.entityId, {
                x: CANVAS_CX + radius * Math.cos(angle),
                y: CANVAS_CY + radius * Math.sin(angle),
            });
        });
    });

    return {
        ...graph,
        nodes: graph.nodes.map((node) => {
            const position = positioned.get(node.entityId);
            return position ? { ...node, ...position } : node;
        }),
    };
}

function pairKey(a: string, b: string): string {
    return [a, b].sort().join('::');
}

// Type-pair -> semantic edge kind, used for `linkedTo`-derived edges (all
// seed sources, including onboarding, flow through this). Falls back to the
// symmetric `relates_to` rather than the generic `explicit`, which is
// reserved for edges a user draws by hand in the Relationships editor.
function inferLinkKind(from: ContextEntry, to: ContextEntry): EdgeKind {
    if (from.entryType === 'widget' && to.entryType === 'goal')
        return 'supports_goal';
    if (from.entryType === 'goal' && to.entryType === 'profile')
        return 'belongs_to';
    if (from.entryType === 'integration' && to.entryType === 'profile')
        return 'belongs_to';
    if (from.entryType === 'todo' && to.entryType === 'goal')
        return 'supports_goal';
    if (from.entryType === 'document' && to.entryType === 'project')
        return 'belongs_to';
    return 'relates_to';
}

// Edges derived from each widget's manifest-declared produces/consumes.
// `produced_by` is correlated by matching `sourceType`, so it only fires on
// entries this specific widget actually produced. `consumed_by` has no
// instance-level consumption log, so it's capped to a few recent candidates
// per type and marked low-confidence — deliberately conservative so this
// doesn't recreate the "everything connects to everything" problem it fixes.
function inferManifestEdges(entries: ContextEntry[]): ContextEdge[] {
    const edges: ContextEdge[] = [];
    const widgets = entries.filter((entry) => entry.entryType === 'widget');

    widgets.forEach((widget) => {
        const widgetType = resolveWidgetType(widget);
        if (!widgetType) return;
        const manifest = getWidgetManifest(widgetType);
        const context = manifest?.context;
        if (!context) return;

        (context.producedNodeTypes ?? []).forEach((producedType) => {
            entries
                .filter(
                    (candidate) =>
                        candidate.entryType === producedType &&
                        candidate.entityId !== widget.entityId &&
                        (!context.contextSourceType ||
                            candidate.sourceType === context.contextSourceType),
                )
                .forEach((candidate) => {
                    edges.push({
                        from: candidate.entityId,
                        to: widget.entityId,
                        label: 'produces',
                        kind: 'produced_by',
                        weight: 2,
                        confidence: 0.8,
                    });
                });
        });

        (context.consumedNodeTypes ?? []).forEach((consumedType) => {
            entries
                .filter(
                    (candidate) =>
                        candidate.entryType === consumedType &&
                        candidate.entityId !== widget.entityId,
                )
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                )
                .slice(0, 3)
                .forEach((candidate) => {
                    edges.push({
                        from: candidate.entityId,
                        to: widget.entityId,
                        label: 'consumes',
                        kind: 'consumed_by',
                        weight: 1,
                        confidence: 0.3,
                        metadata: {
                            inferred: true,
                            reason: 'Manifest declares this consumedNodeType; instance-level linkage not confirmed.',
                        },
                    });
                });
        });
    });

    return edges;
}

function inferCategoryEdges(
    entries: ContextEntry[],
    coveredPairs: Set<string>,
): ContextEdge[] {
    const widgets = entries.filter((entry) => entry.entryType === 'widget');
    const byCategory = new Map<string, ContextEntry[]>();
    widgets.forEach((widget) => {
        const category = String(widget.data.category ?? '').trim();
        if (!category) return;
        byCategory.set(category, [...(byCategory.get(category) ?? []), widget]);
    });

    const edges: ContextEdge[] = [];
    byCategory.forEach((items, category) => {
        items.forEach((item, index) => {
            const next = items[index + 1];
            if (!next) return;
            if (coveredPairs.has(pairKey(item.entityId, next.entityId))) return;
            edges.push({
                from: item.entityId,
                to: next.entityId,
                label: category,
                kind: 'category',
                weight: 2,
            });
        });
    });
    return edges;
}

function inferLegacyEdges(
    entries: ContextEntry[],
    hasPersistedEdges: boolean,
    coveredPairs: Set<string>,
): ContextEdge[] {
    const edges = [
        ...inferCategoryEdges(entries, coveredPairs),
        ...inferWorkflowEdges(entries, coveredPairs),
        ...inferTemporalEdges(entries, coveredPairs),
    ];
    return edges.map((edge) => ({
        ...edge,
        confidence: hasPersistedEdges ? 0.25 : 0.45,
        metadata: {
            ...(edge.metadata ?? {}),
            inferred: true,
            legacyFallback: true,
            reason: hasPersistedEdges
                ? 'Fallback relationship shown below persisted semantic edges.'
                : 'Fallback relationship inferred because no semantic edge exists yet.',
        },
    }));
}

const WORKFLOW_PATTERNS: Array<{
    from: RegExp;
    to: RegExp;
    label: string;
    kind: EdgeKind;
    // When true, the pushed edge direction is (to-match, from-match) instead
    // of (from-match, to-match), so `kind` keeps a consistent semantic
    // direction (e.g. dependent -> dependency) regardless of which regex a
    // pattern happened to name `from`/`to` for matching purposes.
    reverse?: boolean;
}> = [
    {
        from: /reading|highlight|book/i,
        to: /memor|flash|deck/i,
        label: 'review loop',
        kind: 'derived_from',
        reverse: true,
    },
    {
        from: /calendar/i,
        to: /task|todo/i,
        label: 'schedule to tasks',
        kind: 'triggered_by',
        reverse: true,
    },
    {
        from: /journal|note|text/i,
        to: /goal/i,
        label: 'reflection to goals',
        kind: 'supports_goal',
    },
    {
        from: /sleep/i,
        to: /recovery|workout|mood/i,
        label: 'recovery signal',
        kind: 'relates_to',
    },
    {
        from: /workout/i,
        to: /recovery|meal|sleep/i,
        label: 'health loop',
        kind: 'relates_to',
    },
    {
        from: /finance/i,
        to: /goal/i,
        label: 'goal funding',
        kind: 'supports_goal',
    },
    {
        from: /email|inbox/i,
        to: /calendar|task|todo/i,
        label: 'action flow',
        kind: 'triggered_by',
        reverse: true,
    },
];

function inferWorkflowEdges(
    entries: ContextEntry[],
    coveredPairs: Set<string>,
): ContextEdge[] {
    const edges: ContextEdge[] = [];
    entries.forEach((from) => {
        entries.forEach((to) => {
            if (from.entityId === to.entityId) return;
            if (coveredPairs.has(pairKey(from.entityId, to.entityId))) return;
            const pattern = WORKFLOW_PATTERNS.find(
                (item) =>
                    item.from.test(searchableText(from)) &&
                    item.to.test(searchableText(to)),
            );
            if (!pattern) return;
            edges.push({
                from: pattern.reverse ? to.entityId : from.entityId,
                to: pattern.reverse ? from.entityId : to.entityId,
                label: pattern.label,
                kind: pattern.kind,
                weight: 3,
            });
        });
    });
    return edges;
}

function inferTemporalEdges(
    entries: ContextEntry[],
    coveredPairs: Set<string>,
): ContextEdge[] {
    return [...entries]
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6)
        .flatMap((entry, index, recent) => {
            const next = recent[index + 1];
            if (!next) return [];
            if (coveredPairs.has(pairKey(next.entityId, entry.entityId)))
                return [];
            return [
                {
                    from: next.entityId,
                    to: entry.entityId,
                    label: 'recent activity',
                    kind: 'temporal' as const,
                    weight: 1,
                },
            ];
        });
}

function searchableText(entry: ContextEntry) {
    return [
        entry.label,
        entry.entityId,
        entry.entryType,
        ...Object.values(entry.data).map((value) => String(value)),
    ]
        .join(' ')
        .toLowerCase();
}

function activityScore(updatedAt: string) {
    const timestamp = new Date(updatedAt).getTime();
    if (!Number.isFinite(timestamp)) return 0;
    const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
    return Math.max(0, Math.round(100 - ageDays * 8));
}

export const NODE_COLORS: Record<string, string> = {
    profile: '#4f6ef7',
    goal: '#8b5cf6',
    project: '#0891b2',
    widget: '#10b981',
    widget_activity: '#22c55e',
    integration: '#f59e0b',
    query_gist: '#6b7280',
    chat_gist: '#6b7280',
    chat: '#6366f1',
    insight: '#ef4444',
    workflow: '#0ea5e9',
    automation: '#f97316',
    automation_run: '#fb923c',
    file: '#64748b',
    document: '#14b8a6',
    artifact: '#0f766e',
    todo: '#2563eb',
    calendar_event: '#dc2626',
    email: '#f59e0b',
    journal_entry: '#be123c',
    mood_entry: '#db2777',
    habit_entry: '#16a34a',
    recovery_entry: '#0284c7',
    recommendation: '#7c3aed',
    note: '#14b8a6',
    memory: '#a855f7',
    agent_action: '#475569',
    import_export_object: '#64748b',
};

export const NODE_SIZES: Record<string, number> = {
    profile: 62,
    goal: 50,
    widget: 52,
    widget_activity: 38,
    integration: 46,
    query_gist: 40,
    chat_gist: 40,
    insight: 42,
    todo: 42,
    document: 44,
    file: 42,
    calendar_event: 42,
};
