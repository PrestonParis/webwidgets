'use client';

import type { ContextGraph } from '@/features/context/types/context';

interface Props {
    graph: ContextGraph;
    selectedId: string | null;
}

export function ContextEdgeLayer({ graph, selectedId }: Props) {
    const nodeMap = new Map(graph.nodes.map((n) => [n.entityId, n]));

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: 1000, height: 800 }}
            aria-hidden
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="4"
                    refX="5"
                    refY="2"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 6 2, 0 4"
                        fill="#6b7280"
                        opacity="0.5"
                    />
                </marker>
            </defs>
            {graph.edges.map((edge, i) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;
                const isHighlighted =
                    edge.from === selectedId || edge.to === selectedId;
                return (
                    <line
                        key={i}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isHighlighted ? '#4f6ef7' : '#d1d5db'}
                        strokeWidth={isHighlighted ? 1.5 : 1}
                        strokeDasharray={isHighlighted ? undefined : '4 3'}
                        opacity={isHighlighted ? 0.9 : 0.5}
                        markerEnd="url(#arrowhead)"
                    />
                );
            })}
        </svg>
    );
}
