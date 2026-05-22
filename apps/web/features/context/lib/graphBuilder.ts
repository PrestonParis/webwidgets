import type {
    ContextEntry,
    ContextGraph,
    ContextNode,
    ContextEdge,
} from '@/features/context/types/context';

const CANVAS_CX = 500;
const CANVAS_CY = 400;
const INNER_R = 180;
const WIDGET_R = 340;
const GIST_R = 470;

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
    const profileEntries = entries.filter((e) => e.entryType === 'profile');
    const goalEntries = entries.filter((e) => e.entryType === 'goal');
    const integrationEntries = entries.filter(
        (e) => e.entryType === 'integration',
    );
    const widgetEntries = entries.filter((e) => e.entryType === 'widget');
    const gistEntries = entries.filter((e) => e.entryType === 'query_gist');
    const insightEntries = entries.filter((e) => e.entryType === 'insight');

    const innerTotal = goalEntries.length + integrationEntries.length;

    const nodes: ContextNode[] = [
        ...profileEntries.map(
            (e): ContextNode => ({ ...e, x: CANVAS_CX, y: CANVAS_CY }),
        ),
        ...goalEntries.map(
            (e, i): ContextNode => ({
                ...e,
                ...radialPoint(CANVAS_CX, CANVAS_CY, INNER_R, i, innerTotal),
            }),
        ),
        ...integrationEntries.map(
            (e, i): ContextNode => ({
                ...e,
                ...radialPoint(
                    CANVAS_CX,
                    CANVAS_CY,
                    INNER_R,
                    goalEntries.length + i,
                    innerTotal,
                ),
            }),
        ),
        ...widgetEntries.map(
            (e, i): ContextNode => ({
                ...e,
                ...radialPoint(
                    CANVAS_CX,
                    CANVAS_CY,
                    WIDGET_R,
                    i,
                    widgetEntries.length,
                ),
            }),
        ),
        ...gistEntries.map(
            (e, i): ContextNode => ({
                ...e,
                ...radialPoint(
                    CANVAS_CX,
                    CANVAS_CY,
                    GIST_R,
                    i,
                    gistEntries.length,
                    Math.PI / 6,
                ),
            }),
        ),
        ...insightEntries.map(
            (e, i): ContextNode => ({
                ...e,
                ...radialPoint(
                    CANVAS_CX,
                    CANVAS_CY,
                    120,
                    i,
                    insightEntries.length,
                    Math.PI / 4,
                ),
            }),
        ),
    ];

    const nodeMap = new Map(nodes.map((n) => [n.entityId, n]));

    const profileId = profileEntries[0]?.entityId;
    const edges: ContextEdge[] = [];

    // Profile → goals and integrations
    if (profileId) {
        [...goalEntries, ...integrationEntries].forEach((e) => {
            edges.push({ from: profileId, to: e.entityId });
        });
    }

    // Goals → widgets (via linkedTo on widget entries)
    widgetEntries.forEach((w) => {
        w.linkedTo.forEach((linkedId) => {
            if (nodeMap.has(linkedId))
                edges.push({ from: linkedId, to: w.entityId });
        });
    });

    // Integration → widgets
    integrationEntries.forEach((integ) => {
        integ.linkedTo.forEach((linkedId) => {
            if (nodeMap.has(linkedId))
                edges.push({ from: integ.entityId, to: linkedId });
        });
    });

    // Query gists → linked nodes
    gistEntries.forEach((g) => {
        g.linkedTo.forEach((linkedId) => {
            if (nodeMap.has(linkedId))
                edges.push({ from: g.entityId, to: linkedId });
        });
    });

    // Insights → profile
    if (profileId) {
        insightEntries.forEach((ins) => {
            edges.push({ from: profileId, to: ins.entityId });
        });
    }

    return { nodes, edges };
}

export const NODE_COLORS: Record<string, string> = {
    profile: '#4f6ef7',
    goal: '#8b5cf6',
    widget: '#10b981',
    integration: '#f59e0b',
    query_gist: '#6b7280',
    insight: '#ef4444',
};

export const NODE_SIZES: Record<string, number> = {
    profile: 56,
    goal: 44,
    widget: 40,
    integration: 40,
    query_gist: 32,
    insight: 36,
};
