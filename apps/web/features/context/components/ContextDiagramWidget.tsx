'use client';

import { Hand, Network, Pencil, Radio, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { LoadingState } from '@/features/ui/loading';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';
import { useActivityEvents } from '@/features/activity/hooks/useActivityEvents';
import { useWidgetPanMode } from '@/features/context/hooks/useWidgetPanMode';

const NOOP = () => {};
const NOOP_E = (_e: React.MouseEvent) => {};

export default function ContextDiagramWidget({
    widgetId = 'context-diagram',
}: {
    widgetId?: string;
}) {
    const [activeTab, setActiveTab] = useState<'graph' | 'activity'>('graph');
    const { widgetMode, toggleMode, onPanGestureStart, onPanGestureEnd } =
        useWidgetPanMode();

    const { graph, loading, refresh } = useContextGraph();
    const uniqueGraph = {
        ...graph,
        nodes: [
            ...new Map(
                graph.nodes.map((node) => [node.entityId, node]),
            ).values(),
        ],
    };
    const activityQuery = useActivityEvents();
    const events = activityQuery.data ?? [];
    const {
        selectedId,
        viewport,
        selectNode,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        onNodePointerDown,
    } = useContextDiagram(uniqueGraph);

    const modeButtonClass = (active: boolean) =>
        `p-1 rounded transition-colors ${
            active
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
        }`;

    return (
        <WidgetShell
            icon={<Network size={16} />}
            title="Context Graph"
            badge={
                activeTab === 'graph'
                    ? `${uniqueGraph.nodes.length} nodes`
                    : `${events.length} events`
            }
            widgetId={widgetId}
            widgetType="context-diagram"
            footerHref="/context"
            footerLabel="Open context graph ->"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('graph')}
                        className={`px-3 py-1.5 text-xs font-medium ${
                            activeTab === 'graph'
                                ? 'text-gray-900 dark:text-zinc-100 border-b-2 border-gray-900 dark:border-zinc-100'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        Graph
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        className={`px-3 py-1.5 text-xs font-medium ${
                            activeTab === 'activity'
                                ? 'text-gray-900 dark:text-zinc-100 border-b-2 border-gray-900 dark:border-zinc-100'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        Activity
                    </button>
                </div>

                {activeTab === 'graph' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => toggleMode('pan')}
                                    className={modeButtonClass(
                                        widgetMode === 'pan',
                                    )}
                                    title={
                                        widgetMode === 'pan'
                                            ? 'Exit pan mode'
                                            : 'Pan view'
                                    }
                                >
                                    <Hand className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleMode('edit')}
                                    className={modeButtonClass(
                                        widgetMode === 'edit',
                                    )}
                                    title={
                                        widgetMode === 'edit'
                                            ? 'Exit edit mode'
                                            : 'Edit diagram'
                                    }
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => void refresh()}
                                className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                title="Refresh"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="h-48 flex items-center justify-center">
                                <LoadingState variant="inline" />
                            </div>
                        ) : (
                            <div
                                className="h-48 overflow-hidden rounded-lg"
                                // Prevent the dashboard from treating a pan
                                // drag as a widget-move gesture.
                                {...(widgetMode === 'pan'
                                    ? { 'data-no-drag': '' }
                                    : {})}
                            >
                                <ContextGraphCanvas
                                    graph={uniqueGraph}
                                    selectedId={selectedId}
                                    viewport={viewport}
                                    mode={widgetMode}
                                    lockLayout={widgetMode !== 'edit'}
                                    onSelectNode={selectNode}
                                    onMouseDown={
                                        widgetMode === 'pan'
                                            ? (e) => {
                                                  onPanGestureStart();
                                                  onCanvasMouseDown(e);
                                              }
                                            : NOOP_E
                                    }
                                    onMouseMove={
                                        widgetMode === 'pan'
                                            ? onCanvasMouseMove
                                            : NOOP_E
                                    }
                                    onMouseUp={
                                        widgetMode === 'pan'
                                            ? () => {
                                                  onCanvasMouseUp();
                                                  onPanGestureEnd();
                                              }
                                            : NOOP
                                    }
                                    {...(widgetMode === 'edit'
                                        ? { onNodePointerDown }
                                        : {})}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{uniqueGraph.nodes.length} nodes</span>
                            <span>{uniqueGraph.edges.length} connections</span>
                            {widgetMode !== 'view' && (
                                <span className="ml-auto text-indigo-400 dark:text-indigo-500">
                                    {widgetMode === 'pan'
                                        ? 'Drag to pan'
                                        : 'Drag nodes to reposition'}
                                </span>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'activity' && (
                    <div className="h-48 overflow-auto">
                        {activityQuery.isLoading && (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <RefreshCw className="animate-spin" size={16} />
                                Loading activity
                            </div>
                        )}
                        {activityQuery.isError && (
                            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                Activity events are unavailable.
                            </div>
                        )}
                        {!activityQuery.isLoading &&
                            !activityQuery.isError &&
                            events.length === 0 && (
                                <div className="rounded border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                                    No real activity events have been recorded
                                    yet.
                                </div>
                            )}
                        {events.length > 0 && (
                            <div className="space-y-2">
                                {events.slice(0, 5).map((event) => (
                                    <div
                                        key={event.id}
                                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="mt-0.5 text-zinc-500">
                                                <Radio size={14} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                                                    {event.title}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {event.source} ·{' '}
                                                    {new Date(
                                                        event.createdAt,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
