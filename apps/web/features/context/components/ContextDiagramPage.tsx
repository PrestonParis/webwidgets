'use client';

import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Radio } from 'lucide-react';
import { useState } from 'react';
import Header from '@/features/ui/components/Header';
import { LoadingState } from '@/features/ui/loading';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { ContextSidebar } from './ContextSidebar';
import { ContextPermissionsPanel } from './ContextPermissionsPanel';
import { NODE_COLORS } from '@/features/context/lib/graphBuilder';
import { useActivityEvents } from '@/features/activity/hooks/useActivityEvents';

const LEGEND = [
    { type: 'profile', label: 'Profile' },
    { type: 'goal', label: 'Goals' },
    { type: 'widget', label: 'Widgets' },
    { type: 'integration', label: 'Integrations' },
    { type: 'query_gist', label: 'Chat memory' },
    { type: 'insight', label: 'Insights' },
];

export default function ContextDiagramPage() {
    const [activeTab, setActiveTab] = useState<'graph' | 'activity'>('graph');
    const { graph, loading, error, refresh, remove } = useContextGraph();
    const activityQuery = useActivityEvents();
    const events = activityQuery.data ?? [];
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
                            {activeTab === 'graph'
                                ? `${graph.nodes.length} nodes · ${graph.edges.length} connections`
                                : `${events.length} events`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="flex gap-2 border-r border-gray-200 dark:border-zinc-700 pr-3 mr-2">
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
                        {activeTab === 'graph' &&
                            LEGEND.map((item) => (
                                <span
                                    key={item.type}
                                    className="flex items-center gap-1 text-xs text-gray-500 mr-2"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                NODE_COLORS[item.type],
                                        }}
                                    />
                                    {item.label}
                                </span>
                            ))}
                        {activeTab === 'graph' && (
                            <>
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
                            </>
                        )}
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
                        {activeTab === 'graph' && (
                            <>
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
                                            cursor: isDragging
                                                ? 'grabbing'
                                                : 'grab',
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
                            </>
                        )}

                        {activeTab === 'activity' && (
                            <div className="flex-1 overflow-auto">
                                {activityQuery.isLoading && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <RefreshCw
                                            className="animate-spin"
                                            size={16}
                                        />
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
                                            No real activity events have been
                                            recorded yet.
                                        </div>
                                    )}
                                {events.length > 0 && (
                                    <div className="space-y-2">
                                        {events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-zinc-500">
                                                        <Radio size={16} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                                            {event.title}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">
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

                    {activeTab === 'graph' && (
                        <ContextSidebar
                            node={selectedNode}
                            onClose={() => selectNode(null)}
                            onDelete={(id) => {
                                void remove(id);
                                selectNode(null);
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
