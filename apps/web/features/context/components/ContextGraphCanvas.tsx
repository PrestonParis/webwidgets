'use client';

import type { ContextGraphCanvasProps } from '@/features/context/types/context';
import { ContextEdgeLayer } from './ContextEdgeLayer';
import { ContextNodeCard } from './ContextNodeCard';

export function ContextGraphCanvas({
    graph,
    selectedId,
    viewport,
    lockLayout = false,
    mode,
    onSelectNode,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    onNodePointerDown,
    onNodeDoubleClick,
}: ContextGraphCanvasProps) {
    const nodes = [
        ...new Map(graph.nodes.map((node) => [node.entityId, node])).values(),
    ];
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onSelectNode(null);
    };

    // When mode is undefined (full-page view), always show grab cursor.
    // In the widget, only show grab cursor in pan mode.
    const canPan = mode === undefined || mode === 'pan';
    const cursorClass = canPan
        ? 'cursor-grab active:cursor-grabbing'
        : 'cursor-default';

    return (
        <div
            className={`relative overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 ${cursorClass}`}
            style={{
                width: '100%',
                height: '100%',
                touchAction: 'none',
                overscrollBehavior: 'contain',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onClick={handleBackgroundClick}
            role="presentation"
        >
            {nodes.length === 0 && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">
                        Only widget shell context exists
                    </p>
                    <p className="max-w-sm text-center text-xs">
                        Run Sync Context to ingest data from todos, calendar,
                        documents, journals, files, automations, and other saved
                        sources.
                    </p>
                </div>
            )}
            <div
                style={{
                    transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    position: 'relative',
                    width: 1400,
                    height: 1000,
                }}
            >
                <ContextEdgeLayer graph={graph} selectedId={selectedId} />
                {nodes.map((node) => {
                    const dragHandlers = {
                        ...(onNodePointerDown
                            ? { onPointerDown: onNodePointerDown }
                            : {}),
                        ...(onNodeDoubleClick
                            ? { onDoubleClick: onNodeDoubleClick }
                            : {}),
                    };
                    return (
                        <ContextNodeCard
                            key={node.entityId}
                            node={node}
                            selected={node.entityId === selectedId}
                            onClick={onSelectNode}
                            lockLayout={lockLayout}
                            {...dragHandlers}
                        />
                    );
                })}
            </div>
        </div>
    );
}
