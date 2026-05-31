'use client';

import type { ContextEdgeLayerProps } from '@/features/context/types/context';

const EDGE_STYLE: Record<string, { stroke: string; dash?: string }> = {
    explicit: { stroke: '#4f6ef7' },
    mentions: { stroke: '#64748b', dash: '3 4' },
    relates_to: { stroke: '#8b5cf6', dash: '4 4' },
    belongs_to: { stroke: '#14b8a6' },
    created_from: { stroke: '#f59e0b' },
    derived_from: { stroke: '#0ea5e9' },
    summarizes: { stroke: '#22c55e', dash: '5 3' },
    depends_on: { stroke: '#ef4444' },
    supports_goal: { stroke: '#10b981' },
    scheduled_for: { stroke: '#06b6d4', dash: '4 3' },
    assigned_to: { stroke: '#a855f7' },
    produced_by: { stroke: '#6366f1' },
    consumed_by: { stroke: '#7c3aed', dash: '4 3' },
    triggered_by: { stroke: '#f97316' },
    used_by: { stroke: '#84cc16', dash: '3 3' },
    temporal_next: { stroke: '#94a3b8', dash: '2 5' },
    workflow: { stroke: '#0ea5e9' },
    category: { stroke: '#10b981', dash: '5 4' },
    semantic: { stroke: '#8b5cf6', dash: '3 3' },
    temporal: { stroke: '#94a3b8', dash: '2 5' },
};

export function ContextEdgeLayer({ graph, selectedId }: ContextEdgeLayerProps) {
    const nodeMap = new Map(graph.nodes.map((node) => [node.entityId, node]));

    return (
        <svg
            className="pointer-events-none absolute inset-0"
            style={{ width: 1400, height: 1000 }}
            aria-hidden
        >
            <defs>
                {Object.entries(EDGE_STYLE).map(([kind, style]) => (
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
                const style = EDGE_STYLE[kind] ?? { stroke: '#4f6ef7' };
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
                            markerEnd={`url(#arrowhead-${kind})`}
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
