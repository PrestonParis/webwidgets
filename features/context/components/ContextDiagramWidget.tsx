'use client';

import Link from 'next/link';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';

export default function ContextDiagramWidget() {
    const { graph, loading, refresh } = useContextGraph();
    const {
        selectedId,
        viewport,
        selectNode,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
    } = useContextDiagram(graph);

    return (
        <div className="flex flex-col gap-2 h-full p-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide">
                    Context Graph
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => void refresh()}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <Link
                        href="/context"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                        title="Open full view"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex-1 rounded-lg overflow-hidden">
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

            <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{graph.nodes.length} nodes</span>
                <span>{graph.edges.length} connections</span>
            </div>
        </div>
    );
}
