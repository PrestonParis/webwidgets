'use client';

import { useMemo, useState } from 'react';
import { Plus, Radio, X } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import { LoadingState } from '@/features/ui/loading';
import { useContextGraph } from '@/features/context/hooks/useContextGraph';
import { useContextDiagram } from '@/features/context/hooks/useContextDiagram';
import { ContextGraphCanvas } from './ContextGraphCanvas';
import { ContextSidebar } from './ContextSidebar';
import { ContextPermissionsPanel } from './ContextPermissionsPanel';
import { useActivityEvents } from '@/features/activity/hooks/useActivityEvents';
import { ContextFilters, type ContextFilterState } from './ContextFilters';
import { ContextTimeline } from './ContextTimeline';
import { GraphAnalyticsPanel } from './GraphAnalyticsPanel';
import { GraphSearch } from './GraphSearch';
import { GraphToolbar, type GraphLayoutMode } from './GraphToolbar';
import { SavedViewsPanel } from './SavedViewsPanel';
import type {
    ContextEntryType,
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';

const DEFAULT_FILTERS: ContextFilterState = {
    type: 'all',
    relationship: 'all',
    activity: 'all',
    connectedOnly: false,
};

export default function ContextDiagramPage() {
    const [activeTab, setActiveTab] = useState<'graph' | 'activity'>('graph');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<ContextFilterState>(DEFAULT_FILTERS);
    const [layoutMode, setLayoutMode] = useState<GraphLayoutMode>('cluster');
    const [focusMode, setFocusMode] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);

    const { graph, loading, error, refresh, remove, upsert } =
        useContextGraph();
    const activityQuery = useActivityEvents();
    const events = activityQuery.data ?? [];

    const visibleGraph = useMemo(
        () =>
            applyGraphView(graph, {
                search,
                filters,
                layoutMode,
                focusMode,
                selectedId: null,
            }),
        [filters, focusMode, graph, layoutMode, search],
    );

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
    } = useContextDiagram(visibleGraph);

    const focusedGraph = useMemo(
        () =>
            applyGraphView(graph, {
                search,
                filters,
                layoutMode,
                focusMode,
                selectedId,
            }),
        [filters, focusMode, graph, layoutMode, search, selectedId],
    );

    const inspectedNode =
        focusedGraph.nodes.find((node) => node.entityId === selectedId) ??
        selectedNode;

    function exportGraph() {
        const blob = new Blob([JSON.stringify(focusedGraph, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `context-graph-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Header />
            <div className="flex h-[calc(100vh-56px)] flex-col bg-zinc-50 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Context Diagram
                                </h1>
                                <span className="text-xs text-zinc-400">
                                    {focusedGraph.nodes.length} nodes ·{' '}
                                    {focusedGraph.edges.length} relationships
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">
                                Inspect workflows, data flow, activity, and
                                editable context relationships.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                                <TabButton
                                    active={activeTab === 'graph'}
                                    onClick={() => setActiveTab('graph')}
                                >
                                    Graph
                                </TabButton>
                                <TabButton
                                    active={activeTab === 'activity'}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    Activity
                                </TabButton>
                            </div>
                            {activeTab === 'graph' && (
                                <>
                                    <GraphSearch
                                        value={search}
                                        onChange={setSearch}
                                    />
                                    <GraphToolbar
                                        layoutMode={layoutMode}
                                        focusMode={focusMode}
                                        onLayoutModeChange={setLayoutMode}
                                        onFocusModeChange={setFocusMode}
                                        onAddNode={() => setShowAddNode(true)}
                                        onRefresh={() => void refresh()}
                                        onExport={exportGraph}
                                        zoomIn={zoomIn}
                                        zoomOut={zoomOut}
                                        fitView={fitView}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    {activeTab === 'graph' && (
                        <div className="mt-3">
                            <ContextFilters
                                graph={graph}
                                filters={filters}
                                onChange={setFilters}
                            />
                        </div>
                    )}
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3">
                        {activeTab === 'graph' && (
                            <>
                                <GraphAnalyticsPanel
                                    graph={focusedGraph}
                                    onSelectNode={selectNode}
                                />
                                <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                                    <div className="min-h-0">
                                        {error && (
                                            <div className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                                                {error}
                                            </div>
                                        )}
                                        {loading ? (
                                            <div className="flex h-full items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                                                <LoadingState variant="inline" />
                                            </div>
                                        ) : (
                                            <div
                                                className="h-full min-h-[420px]"
                                                style={{
                                                    cursor: isDragging
                                                        ? 'grabbing'
                                                        : 'grab',
                                                }}
                                            >
                                                <ContextGraphCanvas
                                                    graph={focusedGraph}
                                                    selectedId={selectedId}
                                                    viewport={viewport}
                                                    onSelectNode={selectNode}
                                                    onMouseDown={
                                                        onCanvasMouseDown
                                                    }
                                                    onMouseMove={
                                                        onCanvasMouseMove
                                                    }
                                                    onMouseUp={onCanvasMouseUp}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
                                        <SavedViewsPanel
                                            onApply={(view) => {
                                                setFilters(view.filters);
                                                setLayoutMode(view.layoutMode);
                                                setFocusMode(view.focusMode);
                                            }}
                                        />
                                        <ContextTimeline
                                            graph={graph}
                                            onSelectNode={selectNode}
                                        />
                                        <ContextPermissionsPanel />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'activity' && (
                            <ActivityPanel
                                events={events}
                                loading={activityQuery.isLoading}
                                error={activityQuery.isError}
                            />
                        )}
                    </div>

                    {activeTab === 'graph' && (
                        <ContextSidebar
                            node={inspectedNode}
                            graph={graph}
                            onSelectNode={selectNode}
                            onUpsert={upsert}
                            onClose={() => selectNode(null)}
                            onDelete={(id) => {
                                void remove(id);
                                selectNode(null);
                            }}
                        />
                    )}
                </div>
            </div>

            {showAddNode && (
                <AddNodeDialog
                    onClose={() => setShowAddNode(false)}
                    onCreate={async (payload) => {
                        await upsert(payload);
                        setShowAddNode(false);
                        selectNode(payload.entityId);
                    }}
                />
            )}
        </>
    );
}

function applyGraphView(
    graph: ContextGraph,
    options: {
        search: string;
        filters: ContextFilterState;
        layoutMode: GraphLayoutMode;
        focusMode: boolean;
        selectedId: string | null;
    },
): ContextGraph {
    const query = options.search.trim().toLowerCase();
    const allowedByRelationship = new Set<string>();
    if (options.filters.relationship !== 'all') {
        graph.edges
            .filter(
                (edge) =>
                    (edge.kind ?? 'explicit') === options.filters.relationship,
            )
            .forEach((edge) => {
                allowedByRelationship.add(edge.from);
                allowedByRelationship.add(edge.to);
            });
    }

    const focusIds = new Set<string>();
    if (options.focusMode && options.selectedId) {
        focusIds.add(options.selectedId);
        graph.edges.forEach((edge) => {
            if (edge.from === options.selectedId) focusIds.add(edge.to);
            if (edge.to === options.selectedId) focusIds.add(edge.from);
        });
    }

    const nodes = graph.nodes.filter((node) => {
        if (
            options.filters.type !== 'all' &&
            node.entryType !== options.filters.type
        )
            return false;
        if (
            options.filters.relationship !== 'all' &&
            !allowedByRelationship.has(node.entityId)
        )
            return false;
        if (options.filters.connectedOnly && (node.connectionCount ?? 0) === 0)
            return false;
        if (
            options.filters.activity === 'active' &&
            (node.activityScore ?? 0) < 60
        )
            return false;
        if (
            options.filters.activity === 'quiet' &&
            (node.activityScore ?? 0) >= 60
        )
            return false;
        if (
            options.focusMode &&
            options.selectedId &&
            !focusIds.has(node.entityId)
        )
            return false;
        if (!query) return true;
        return [
            node.label,
            node.entityId,
            node.entryType,
            ...Object.values(node.data).map((value) => String(value)),
        ]
            .join(' ')
            .toLowerCase()
            .includes(query);
    });

    const ids = new Set(nodes.map((node) => node.entityId));
    const edges = graph.edges.filter(
        (edge) =>
            ids.has(edge.from) &&
            ids.has(edge.to) &&
            (options.filters.relationship === 'all' ||
                (edge.kind ?? 'explicit') === options.filters.relationship),
    );

    return layoutVisibleGraph({ nodes, edges }, options.layoutMode);
}

function layoutVisibleGraph(
    graph: ContextGraph,
    mode: GraphLayoutMode,
): ContextGraph {
    if (mode === 'cluster') return graph;
    if (mode === 'workflow') {
        const lanes = [
            'profile',
            'goal',
            'integration',
            'widget',
            'query_gist',
            'insight',
        ];
        const grouped = new Map<string, ContextNode[]>();
        graph.nodes.forEach((node) => {
            grouped.set(node.entryType, [
                ...(grouped.get(node.entryType) ?? []),
                node,
            ]);
        });
        return {
            ...graph,
            nodes: graph.nodes.map((node) => {
                const lane = Math.max(0, lanes.indexOf(node.entryType));
                const laneNodes = grouped.get(node.entryType) ?? [];
                const index = laneNodes.findIndex(
                    (item) => item.entityId === node.entityId,
                );
                return {
                    ...node,
                    x: 130 + lane * 150,
                    y: 120 + index * 92,
                };
            }),
        };
    }

    const columns = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)));
    return {
        ...graph,
        nodes: graph.nodes.map((node, index) => ({
            ...node,
            x: 130 + (index % columns) * 145,
            y: 110 + Math.floor(index / columns) * 92,
        })),
    };
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                active
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
        >
            {children}
        </button>
    );
}

function ActivityPanel({
    events,
    loading,
    error,
}: {
    events: Array<{
        id: string;
        title: string;
        source: string;
        createdAt: string;
    }>;
    loading: boolean;
    error: boolean;
}) {
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Radio className="animate-pulse" size={16} />
                Loading activity
            </div>
        );
    }
    if (error) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Activity events are unavailable.
            </div>
        );
    }
    if (events.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-3 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                No real activity events have been recorded yet.
            </div>
        );
    }
    return (
        <div className="space-y-2 overflow-auto">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        {event.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                        {event.source} ·{' '}
                        {new Date(event.createdAt).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

function AddNodeDialog({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (payload: {
        entityId: string;
        entryType: ContextEntryType;
        label: string;
        data: Record<string, unknown>;
        linkedTo: string[];
    }) => Promise<void>;
}) {
    const [label, setLabel] = useState('');
    const [type, setType] = useState<ContextEntryType>('insight');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!label.trim()) return;
        setSaving(true);
        try {
            await onCreate({
                entityId: `${type}-${label
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
                entryType: type,
                label: label.trim(),
                data: note.trim()
                    ? { note: note.trim(), source: 'manual' }
                    : { source: 'manual' },
                linkedTo: [],
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
                onSubmit={(event) => void submit(event)}
                className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        Add Context Node
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close">
                        <X size={16} className="text-zinc-400" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Node label"
                        className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <select
                        value={type}
                        onChange={(event) =>
                            setType(event.target.value as ContextEntryType)
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                        <option value="insight">Insight</option>
                        <option value="goal">Goal</option>
                        <option value="query_gist">Memory</option>
                    </select>
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Stored context"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                        type="submit"
                        disabled={!label.trim() || saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                        <Plus size={15} />
                        Create Node
                    </button>
                </div>
            </form>
        </div>
    );
}
