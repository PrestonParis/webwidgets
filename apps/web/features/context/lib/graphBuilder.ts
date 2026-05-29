import type {
    ContextEdge,
    ContextEntry,
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';

const CANVAS_CX = 500;
const CANVAS_CY = 380;
const CLUSTER_R = 205;
const NODE_GAP = 84;

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

export function buildContextGraph(entries: ContextEntry[]): ContextGraph {
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

    const profileId = uniqueEntries.find(
        (entry) => entry.entryType === 'profile',
    )?.entityId;

    uniqueEntries.forEach((entry) => {
        entry.linkedTo.forEach((linkedId) => {
            pushEdge({
                from: linkedId,
                to: entry.entityId,
                label: 'linked',
                kind: 'explicit',
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
                    from: profileId,
                    to: entry.entityId,
                    label:
                        entry.entryType === 'widget'
                            ? 'workspace'
                            : entry.entryType,
                    kind: 'explicit',
                    weight: entry.entryType === 'widget' ? 2 : 3,
                });
            });
    }

    inferCategoryEdges(uniqueEntries).forEach(pushEdge);
    inferWorkflowEdges(uniqueEntries).forEach(pushEdge);
    inferTemporalEdges(uniqueEntries).forEach(pushEdge);

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

function inferCategoryEdges(entries: ContextEntry[]): ContextEdge[] {
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

const WORKFLOW_PATTERNS: Array<{
    from: RegExp;
    to: RegExp;
    label: string;
}> = [
    {
        from: /reading|highlight|book/i,
        to: /memor|flash|deck/i,
        label: 'review loop',
    },
    { from: /calendar/i, to: /task|todo/i, label: 'schedule to tasks' },
    { from: /journal|note|text/i, to: /goal/i, label: 'reflection to goals' },
    { from: /sleep/i, to: /recovery|workout|mood/i, label: 'recovery signal' },
    { from: /workout/i, to: /recovery|meal|sleep/i, label: 'health loop' },
    { from: /finance/i, to: /goal/i, label: 'goal funding' },
    { from: /email|inbox/i, to: /calendar|task|todo/i, label: 'action flow' },
    {
        from: /chat|gist|memory/i,
        to: /note|goal|task|widget/i,
        label: 'context recall',
    },
];

function inferWorkflowEdges(entries: ContextEntry[]): ContextEdge[] {
    const edges: ContextEdge[] = [];
    entries.forEach((from) => {
        entries.forEach((to) => {
            if (from.entityId === to.entityId) return;
            const pattern = WORKFLOW_PATTERNS.find(
                (item) =>
                    item.from.test(searchableText(from)) &&
                    item.to.test(searchableText(to)),
            );
            if (!pattern) return;
            edges.push({
                from: from.entityId,
                to: to.entityId,
                label: pattern.label,
                kind: 'workflow',
                weight: 3,
            });
        });
    });
    return edges;
}

function inferTemporalEdges(entries: ContextEntry[]): ContextEdge[] {
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
    widget: '#10b981',
    integration: '#f59e0b',
    query_gist: '#6b7280',
    insight: '#ef4444',
    workflow: '#0ea5e9',
    automation: '#f97316',
    file: '#64748b',
    note: '#14b8a6',
    memory: '#a855f7',
};

export const NODE_SIZES: Record<string, number> = {
    profile: 62,
    goal: 50,
    widget: 52,
    integration: 46,
    query_gist: 40,
    insight: 42,
};
