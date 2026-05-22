'use client';

import type { ContextGraph } from '@/features/context/types/context';
import type { DiagramViewport } from '@/features/context/types/diagram';
import { ContextEdgeLayer } from './ContextEdgeLayer';
import { ContextNodeCard } from './ContextNodeCard';

interface Props {
    graph: ContextGraph;
    selectedId: string | null;
    viewport: DiagramViewport;
    onSelectNode: (id: string | null) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
}

export function ContextGraphCanvas({
    graph,
    selectedId,
    viewport,
    onSelectNode,
    onMouseDown,
    onMouseMove,
    onMouseUp,
}: Props) {
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onSelectNode(null);
    };

    return (
        <div
            className="relative overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800"
            style={{ width: '100%', height: '100%', cursor: 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={handleBackgroundClick}
            role="presentation"
        >
            {graph.nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-4xl">🕸️</span>
                    <p className="text-sm">
                        Your context graph will appear here after onboarding.
                    </p>
                </div>
            )}
            <div
                style={{
                    transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
                    transformOrigin: '500px 400px',
                    position: 'relative',
                    width: 1000,
                    height: 800,
                }}
            >
                <ContextEdgeLayer graph={graph} selectedId={selectedId} />
                {graph.nodes.map((node) => (
                    <ContextNodeCard
                        key={node.entityId}
                        node={node}
                        selected={node.entityId === selectedId}
                        onClick={onSelectNode}
                    />
                ))}
            </div>
        </div>
    );
}
