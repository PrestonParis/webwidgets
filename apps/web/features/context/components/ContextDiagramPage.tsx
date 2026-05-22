'use client';

import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import { LoadingState } from '@/features/ui/loading';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { ContextSidebar } from './ContextSidebar';
import { ContextPermissionsPanel } from './ContextPermissionsPanel';
import { NODE_COLORS } from '@/features/context/lib/graphBuilder';

const LEGEND = [
    { type: 'profile', label: 'Profile' },
    { type: 'goal', label: 'Goals' },
    { type: 'widget', label: 'Widgets' },
    { type: 'integration', label: 'Integrations' },
    { type: 'query_gist', label: 'Chat memory' },
    { type: 'insight', label: 'Insights' },
];

export default function ContextDiagramPage() {
    const { graph, loading, error, refresh, remove } = useContextGraph();
    const {
        selectedId,
        selectedNode,
        viewport,
        isDragging,
        selectNode,
        zoomIn,
        zoomOut,
        fitView,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
    } = useContextDiagram(graph);

    return (
        <>
            <Header />
            <div className="flex flex-col h-[calc(100vh-56px)]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Context Diagram
                        </h1>
                        <span className="text-xs text-gray-400">
                            {graph.nodes.length} nodes · {graph.edges.length}{' '}
                            connections
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {LEGEND.map((item) => (
                            <span
                                key={item.type}
                                className="flex items-center gap-1 text-xs text-gray-500 mr-2"
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                        backgroundColor: NODE_COLORS[item.type],
                                    }}
                                />
                                {item.label}
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={zoomIn}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            type="button"
                            onClick={zoomOut}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            type="button"
                            onClick={fitView}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                            title="Fit view"
                        >
                            <Maximize2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
                        {error && (
                            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                                {error}
                            </div>
                        )}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <LoadingState variant="inline" />
                            </div>
                        ) : (
                            <div
                                className="flex-1"
                                style={{
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                }}
                            >
                                <ContextGraphCanvas
                                    graph={graph}
                                    selectedId={selectedId}
                                    viewport={viewport}
                                    onSelectNode={selectNode}
                                    onMouseDown={onCanvasMouseDown}
                                    onMouseMove={onCanvasMouseMove}
                                    onMouseUp={onCanvasMouseUp}
                                />
                            </div>
                        )}
                        <ContextPermissionsPanel />
                    </div>

                    <ContextSidebar
                        node={selectedNode}
                        onClose={() => selectNode(null)}
                        onDelete={(id) => {
                            void remove(id);
                            selectNode(null);
                        }}
                    />
                </div>
            </div>
        </>
    );
}
