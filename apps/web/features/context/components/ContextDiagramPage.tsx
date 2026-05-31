'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    DatabaseZap,
    Download,
    Filter,
    Focus,
    Lock,
    Maximize2,
    PanelRight,
    Plus,
    Radio,
    RefreshCw,
    RotateCcw,
    Unlock,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import type { GraphLayoutMode } from './GraphToolbar';
import { SavedViewsPanel } from './SavedViewsPanel';
import {
    fetchContextCoverage,
    runContextBackfill,
    type ContextBackfillSummary,
    type ContextCoverageReport,
} from '@/features/context/api/contextApi';
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
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [overviewOpen, setOverviewOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncSummary, setSyncSummary] =
        useState<ContextBackfillSummary | null>(null);
    const [coverage, setCoverage] = useState<ContextCoverageReport | null>(
        null,
    );

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
        graph: diagramGraph,
        viewport,
        isDragging,
        lockLayout,
        setLockLayout,
        selectNode,
        zoomIn,
        zoomOut,
        fitView,
        resetLayout,
        focusNode,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        onCanvasWheel,
        onNodePointerDown,
    } = useContextDiagram(visibleGraph);

    const inspectedNode =
        diagramGraph.nodes.find((node) => node.entityId === selectedId) ??
        selectedNode;
    const renderedGraph = useMemo(() => {
        if (!focusMode || !selectedId) return diagramGraph;
        const ids = new Set([selectedId]);
        diagramGraph.edges.forEach((edge) => {
            if (edge.from === selectedId) ids.add(edge.to);
            if (edge.to === selectedId) ids.add(edge.from);
        });
        return {
            nodes: diagramGraph.nodes.filter((node) => ids.has(node.entityId)),
            edges: diagramGraph.edges.filter(
                (edge) => ids.has(edge.from) && ids.has(edge.to),
            ),
        };
    }, [diagramGraph, focusMode, selectedId]);

    useEffect(() => {
        void fetchContextCoverage()
            .then(setCoverage)
            .catch(() => setCoverage(null));
    }, []);

    useEffect(() => {
        if (selectedId) setInspectorOpen(true);
    }, [selectedId]);

    async function syncContext() {
        setSyncing(true);
        try {
            const summary = await runContextBackfill();
            setSyncSummary(summary);
            await refresh();
            const nextCoverage = await fetchContextCoverage();
            setCoverage(nextCoverage);
        } finally {
            setSyncing(false);
        }
    }

    function exportGraph() {
        const blob = new Blob([JSON.stringify(renderedGraph, null, 2)], {
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
            <div className="flex h-[calc(100vh-56px)] min-h-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
                    <div className="mr-1 min-w-44">
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Context Diagram
                            </h1>
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                {renderedGraph.nodes.length} ·{' '}
                                {renderedGraph.edges.length}
                            </span>
                        </div>
                    </div>

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
                            <div className="min-w-56 flex-1 md:max-w-md">
                                <GraphSearch
                                    value={search}
                                    onChange={setSearch}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => void syncContext()}
                                disabled={syncing}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                <DatabaseZap size={15} />
                                {syncing ? 'Syncing' : 'Sync'}
                            </button>
                            <div className="relative">
                                <MiniIconButton
                                    title="Filters"
                                    icon={Filter}
                                    active={filtersOpen}
                                    onClick={() =>
                                        setFiltersOpen((open) => !open)
                                    }
                                />
                                {filtersOpen && (
                                    <div className="absolute right-0 top-11 z-40 w-80 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                                        <ContextFilters
                                            graph={graph}
                                            filters={filters}
                                            onChange={setFilters}
                                        />
                                    </div>
                                )}
                            </div>
                            <select
                                value={layoutMode}
                                onChange={(event) =>
                                    setLayoutMode(
                                        event.target.value as GraphLayoutMode,
                                    )
                                }
                                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                aria-label="Layout"
                            >
                                <option value="cluster">Clusters</option>
                                <option value="workflow">Workflow</option>
                                <option value="compact">Compact</option>
                            </select>
                            <MiniIconButton
                                title={
                                    lockLayout
                                        ? 'Unlock node movement'
                                        : 'Lock node movement'
                                }
                                icon={lockLayout ? Lock : Unlock}
                                active={lockLayout}
                                onClick={() => setLockLayout(!lockLayout)}
                            />
                            <MiniIconButton
                                title="Inspector"
                                icon={PanelRight}
                                active={inspectorOpen}
                                onClick={() =>
                                    setInspectorOpen((open) => !open)
                                }
                            />
                            <MiniIconButton
                                title="Focus selected"
                                icon={Focus}
                                active={focusMode}
                                onClick={() => {
                                    setFocusMode(!focusMode);
                                    focusNode(selectedId);
                                }}
                            />
                            <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                                <MiniIconButton
                                    title="Zoom out"
                                    icon={ZoomOut}
                                    borderless
                                    onClick={zoomOut}
                                />
                                <MiniIconButton
                                    title="Zoom in"
                                    icon={ZoomIn}
                                    borderless
                                    onClick={zoomIn}
                                />
                                <MiniIconButton
                                    title="Fit view"
                                    icon={Maximize2}
                                    borderless
                                    onClick={fitView}
                                />
                            </div>
                            <MiniIconButton
                                title="Reset layout"
                                icon={RotateCcw}
                                onClick={resetLayout}
                            />
                            <MiniIconButton
                                title="Add context node"
                                icon={Plus}
                                onClick={() => setShowAddNode(true)}
                            />
                            <MiniIconButton
                                title="Export graph JSON"
                                icon={Download}
                                onClick={exportGraph}
                            />
                            <MiniIconButton
                                title="Refresh"
                                icon={RefreshCw}
                                onClick={() => void refresh()}
                            />
                            <button
                                type="button"
                                onClick={() => setOverviewOpen((open) => !open)}
                                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                            >
                                Overview
                            </button>
                        </>
                    )}
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden p-2">
                    {activeTab === 'graph' ? (
                        <>
                            {error && (
                                <div className="absolute left-4 top-4 z-20 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow dark:bg-amber-950/80 dark:text-amber-200">
                                    {error}
                                </div>
                            )}
                            {loading ? (
                                <div className="flex h-full items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                                    <LoadingState variant="inline" />
                                </div>
                            ) : (
                                <div
                                    className="h-full min-h-0"
                                    style={{
                                        cursor: isDragging
                                            ? 'grabbing'
                                            : 'default',
                                    }}
                                >
                                    <ContextGraphCanvas
                                        graph={renderedGraph}
                                        selectedId={selectedId}
                                        viewport={viewport}
                                        lockLayout={lockLayout}
                                        onSelectNode={selectNode}
                                        onMouseDown={onCanvasMouseDown}
                                        onMouseMove={onCanvasMouseMove}
                                        onMouseUp={onCanvasMouseUp}
                                        onWheel={onCanvasWheel}
                                        onNodePointerDown={onNodePointerDown}
                                        onNodeDoubleClick={focusNode}
                                    />
                                </div>
                            )}

                            {overviewOpen && (
                                <div className="absolute bottom-4 left-4 z-30 max-h-[55vh] w-[min(520px,calc(100vw-2rem))] overflow-auto rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
                                    <ContextCoveragePanel
                                        graph={renderedGraph}
                                        coverage={coverage}
                                        syncSummary={syncSummary}
                                        syncing={syncing}
                                        onSync={() => void syncContext()}
                                    />
                                    <div className="mt-3">
                                        <GraphAnalyticsPanel
                                            graph={renderedGraph}
                                            onSelectNode={selectNode}
                                        />
                                    </div>
                                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                        <SavedViewsPanel
                                            current={{
                                                filters,
                                                layoutMode,
                                                focusMode,
                                                focusNode: selectedId,
                                            }}
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
                            )}

                            {inspectorOpen && (
                                <div className="absolute bottom-2 right-2 top-2 z-30 w-[min(390px,calc(100vw-1rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                                    <ContextSidebar
                                        node={inspectedNode}
                                        graph={renderedGraph}
                                        onSelectNode={selectNode}
                                        onUpsert={upsert}
                                        onClose={() => {
                                            setInspectorOpen(false);
                                            selectNode(null);
                                        }}
                                        onDelete={(id) => {
                                            void remove(id);
                                            selectNode(null);
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <ActivityPanel
                            events={events}
                            loading={activityQuery.isLoading}
                            error={activityQuery.isError}
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

function MiniIconButton({
    title,
    icon: Icon,
    onClick,
    active = false,
    borderless = false,
}: {
    title: string;
    icon: LucideIcon;
    onClick: () => void;
    active?: boolean;
    borderless?: boolean;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`flex h-9 w-9 items-center justify-center text-zinc-500 transition hover:text-zinc-950 dark:hover:text-zinc-100 ${
                borderless
                    ? ''
                    : 'rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
            } ${
                active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : ''
            }`}
        >
            <Icon size={15} />
        </button>
    );
}

function ContextCoveragePanel({
    graph,
    coverage,
    syncSummary,
    syncing,
    onSync,
}: {
    graph: ContextGraph;
    coverage: ContextCoverageReport | null;
    syncSummary: ContextBackfillSummary | null;
    syncing: boolean;
    onSync: () => void;
}) {
    const nodeCounts =
        coverage?.summary.nodeCountsByType ?? countNodesByType(graph.nodes);
    const sourceCounts = coverage?.summary.sourceCountsBySourceType ?? {};
    const zeroSources =
        coverage?.features
            .filter((feature) => feature.backfillSupported)
            .filter((feature) => feature.actualNodeCount === 0)
            .slice(0, 6) ?? [];
    const sourceTotal =
        syncSummary?.sources.filter((source) => !source.skippedReason).length ??
        0;
    const sourceErrors =
        syncSummary?.sources.filter(
            (source) => source.errors.length || source.skippedReason,
        ).length ?? 0;

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Metric
                        label="Nodes"
                        value={
                            coverage?.summary.totalNodes ?? graph.nodes.length
                        }
                    />
                    <Metric
                        label="Edges"
                        value={
                            coverage?.summary.totalEdges ?? graph.edges.length
                        }
                    />
                    <Metric
                        label="Sources"
                        value={Object.keys(sourceCounts).length}
                    />
                    <Metric
                        label="Last sync"
                        value={
                            coverage?.summary.lastObservedAt
                                ? new Date(
                                      coverage.summary.lastObservedAt,
                                  ).toLocaleDateString()
                                : 'None'
                        }
                    />
                </div>
                <button
                    type="button"
                    onClick={onSync}
                    disabled={syncing}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                >
                    <DatabaseZap size={15} />
                    {syncing ? 'Syncing context' : 'Pull platform data'}
                </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {Object.entries(nodeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([type, count]) => (
                        <span
                            key={type}
                            className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                            {type}: {count}
                        </span>
                    ))}
                {zeroSources.map((feature) => (
                    <span
                        key={feature.id}
                        className="rounded-md bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                        {feature.name}: 0
                    </span>
                ))}
            </div>
            {syncSummary && (
                <p className="mt-2 text-xs text-zinc-500">
                    Synced {sourceTotal} sources, found{' '}
                    {syncSummary.totals.recordsFound} records, added{' '}
                    {syncSummary.totals.nodesCreated} nodes, updated{' '}
                    {syncSummary.totals.nodesUpdated}, with {sourceErrors}{' '}
                    skipped/error sources.
                </p>
            )}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="text-[11px] font-medium uppercase text-zinc-400">
                {label}
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {value}
            </div>
        </div>
    );
}

function countNodesByType(nodes: ContextNode[]) {
    return nodes.reduce<Record<string, number>>((acc, node) => {
        acc[node.entryType] = (acc[node.entryType] ?? 0) + 1;
        return acc;
    }, {});
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
    const uniqueNodes = [
        ...new Map(graph.nodes.map((node) => [node.entityId, node])).values(),
    ];
    const graphWithUniqueNodes = { ...graph, nodes: uniqueNodes };
    const query = options.search.trim().toLowerCase();
    const allowedByRelationship = new Set<string>();
    if (options.filters.relationship !== 'all') {
        graphWithUniqueNodes.edges
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
        graphWithUniqueNodes.edges.forEach((edge) => {
            if (edge.from === options.selectedId) focusIds.add(edge.to);
            if (edge.to === options.selectedId) focusIds.add(edge.from);
        });
    }

    const nodes = graphWithUniqueNodes.nodes.filter((node) => {
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
            node.summary,
            node.sourceType,
            node.sourceId,
            ...(node.tags ?? []),
            ...Object.values(node.data).map((value) => String(value)),
            ...Object.values(node.metadata ?? {}).map((value) => String(value)),
        ]
            .join(' ')
            .toLowerCase()
            .includes(query);
    });

    const ids = new Set(nodes.map((node) => node.entityId));
    const edges = graphWithUniqueNodes.edges.filter(
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
