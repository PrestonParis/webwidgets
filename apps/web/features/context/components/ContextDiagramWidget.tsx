'use client';

import { Network, RefreshCw } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { LoadingState } from '@/features/ui/loading';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';

export default function ContextDiagramWidget({
    widgetId = 'context-diagram',
}: {
    widgetId?: string;
}) {
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
        <WidgetShell
            icon={<Network size={16} />}
            title="Context Graph"
            badge={`${graph.nodes.length} nodes`}
            widgetId={widgetId}
            widgetType="context-diagram"
            footerHref="/context"
            footerLabel="Open context graph ->"
        >
            <div className="flex h-full flex-col gap-2">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => void refresh()}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingState variant="inline" />
                    </div>
                ) : (
                    <div className="min-h-56 flex-1 overflow-hidden rounded-lg">
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
        </WidgetShell>
    );
}
