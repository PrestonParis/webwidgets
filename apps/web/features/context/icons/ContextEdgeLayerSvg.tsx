'use client';

import type { ContextEdgeLayerProps } from '@/features/context/types/context';

// Six primary relationship kinds get a distinct, saturated style so the
// graph reads at a glance. Everything else (explicit user-drawn links
// aside) shares one muted secondary style — kind name still shows on
// hover/selection via the edge label, it just isn't color-coded.
const PRIMARY_EDGE_STYLE: Record<string, { stroke: string; dash?: string }> = {
    produced_by: { stroke: '#6366f1' },
    consumed_by: { stroke: '#7c3aed', dash: '4 3' },
    depends_on: { stroke: '#ef4444' },
    triggered_by: { stroke: '#f97316' },
    belongs_to: { stroke: '#14b8a6' },
    relates_to: { stroke: '#8b5cf6', dash: '4 4' },
    explicit: { stroke: '#4f6ef7' },
};
const SECONDARY_EDGE_STYLE = { stroke: '#94a3b8', dash: '2 3' };

function getEdgeStyle(kind: string) {
    return PRIMARY_EDGE_STYLE[kind] ?? SECONDARY_EDGE_STYLE;
}

export function ContextEdgeLayerSvg({
    graph,
    selectedId,
}: ContextEdgeLayerProps) {
    const nodeMap = new Map(graph.nodes.map((node) => [node.entityId, node]));

    return (
        <svg
            className="pointer-events-none absolute inset-0"
            style={{ width: 1400, height: 1000 }}
            aria-hidden
        >
            <defs>
                {[
                    ...Object.entries(PRIMARY_EDGE_STYLE),
                    ['secondary', SECONDARY_EDGE_STYLE] as const,
                ].map(([kind, style]) => (
                    <marker
                        key={kind}
                        id={`arrowhead-${kind}`}
                        markerWidth="7"
                        markerHeight="5"
                        refX="6"
                        refY="2.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 7 2.5, 0 5"
                            fill={style.stroke}
                            opacity="0.8"
                        />
                    </marker>
                ))}
            </defs>
            {graph.edges.map((edge, index) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;
                if (
                    !Number.isFinite(from.x) ||
                    !Number.isFinite(from.y) ||
                    !Number.isFinite(to.x) ||
                    !Number.isFinite(to.y)
                )
                    return null;
                const kind = edge.kind ?? 'explicit';
                const style = getEdgeStyle(kind);
                const markerKind = PRIMARY_EDGE_STYLE[kind]
                    ? kind
                    : 'secondary';
                const isHighlighted =
                    edge.from === selectedId || edge.to === selectedId;
                const opacity = isHighlighted ? 0.95 : 0.42;
                const width = isHighlighted
                    ? 2.4
                    : Math.max(1, edge.weight ?? 1);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;

                return (
                    <g key={`${edge.from}-${edge.to}-${kind}-${index}`}>
                        <line
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke={style.stroke}
                            strokeWidth={width}
                            strokeDasharray={style.dash}
                            opacity={opacity}
                            markerEnd={`url(#arrowhead-${markerKind})`}
                        />
                        {isHighlighted && edge.label && (
                            <text
                                x={midX}
                                y={midY - 6}
                                textAnchor="middle"
                                className="fill-zinc-600 text-[10px] dark:fill-zinc-300"
                            >
                                {edge.label}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
