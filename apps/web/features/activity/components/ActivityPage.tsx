'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    useActivityEvents,
    useActivityEventMutation,
    useActivityBulkMutation,
} from '@/features/activity/hooks/useActivityEvents';
import { buildActivityClusters } from '@/features/activity/lib/activityClusters';
import { buildRecommendations } from '@/features/activity/lib/activityRecommendations';
import type {
    ActivityEvent,
    ActivityEventCategory,
    ActivityEventSource,
} from '@/features/activity/types/activity';
import type { ActivityCluster } from '@/features/activity/lib/activityClusters';
import type { ActivityRecommendation } from '@/features/activity/lib/activityRecommendations';

type Tab = 'all' | 'unread' | 'failed' | 'archived';

const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'failed', label: 'Failed' },
    { id: 'archived', label: 'Archived' },
];

const SOURCE_ICONS: Record<string, string> = {
    artifact: '🤖',
    file: '📄',
    email: '✉️',
    calendar: '📅',
    tracking: '📊',
    automation: '⚙️',
    finance: '💰',
    integrations: '🔗',
    onboarding: '🚀',
    system: '🖥️',
    news: '📰',
    todo: '✅',
    document: '📝',
    memory: '🧠',
    reading: '📖',
    collaboration: '🤝',
    research: '🔬',
};

const SEVERITY_DOT: Record<string, string> = {
    info: 'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    critical: 'bg-red-500',
};

const CATEGORY_COLORS: Record<string, string> = {
    ai: 'text-purple-600 dark:text-purple-400',
    content: 'text-blue-600 dark:text-blue-400',
    data: 'text-teal-600 dark:text-teal-400',
    automation: 'text-orange-600 dark:text-orange-400',
    system: 'text-zinc-500 dark:text-zinc-400',
};

const ALL_SOURCES: ActivityEventSource[] = [
    'artifact',
    'file',
    'todo',
    'document',
    'calendar',
    'finance',
    'automation',
    'tracking',
    'email',
    'news',
    'memory',
    'reading',
    'collaboration',
    'research',
    'system',
];

const ALL_CATEGORIES: ActivityEventCategory[] = [
    'ai',
    'content',
    'data',
    'automation',
    'system',
];

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

function getDateGroup(iso: string): DateGroup {
    const now = new Date();
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / 86_400_000;
    if (diffDays < 1 && now.getDate() === d.getDate()) return 'Today';
    if (diffDays < 2 && now.getDate() - d.getDate() === 1) return 'Yesterday';
    if (diffDays < 7) return 'This Week';
    return 'Earlier';
}

function groupEvents(events: ActivityEvent[]): [DateGroup, ActivityEvent[]][] {
    const groups: Record<DateGroup, ActivityEvent[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Earlier: [],
    };
    for (const ev of events) groups[getDateGroup(ev.occurredAt)].push(ev);
    const order: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order
        .map((g): [DateGroup, ActivityEvent[]] => [g, groups[g]])
        .filter(([, evs]) => evs.length > 0);
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString();
}

function computeSummaryStats(events: ActivityEvent[]) {
    const now = Date.now();
    const h24 = 24 * 3_600_000;
    const today = events.filter(
        (e) => now - new Date(e.occurredAt).getTime() < h24,
    );
    const byEventType = new Map<string, number>();
    for (const e of today) {
        const k = e.eventType ?? e.source;
        byEventType.set(k, (byEventType.get(k) ?? 0) + 1);
    }
    const cards = [
        { key: 'todo.completed', label: 'Tasks completed', icon: '✅' },
        { key: 'artifact.generated', label: 'Artifacts generated', icon: '🤖' },
        { key: 'file.uploaded', label: 'Files uploaded', icon: '📄' },
        { key: 'memory.card_reviewed', label: 'Cards reviewed', icon: '🧠' },
        { key: 'news.imported', label: 'Feeds imported', icon: '📰' },
        { key: 'email.action_extracted', label: 'Email batches', icon: '✉️' },
    ]
        .map((c) => ({ ...c, count: byEventType.get(c.key) ?? 0 }))
        .filter((c) => c.count > 0);
    return { todayCount: today.length, cards };
}

function NeedsAttentionCard({
    event,
    onDismiss,
}: {
    event: ActivityEvent;
    onDismiss: (id: string) => void;
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30">
            <span className="text-base shrink-0 mt-0.5">
                {event.severity === 'critical' ? '🔴' : '🟡'}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                    {event.title}
                </p>
                {event.body && (
                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                        {event.body}
                    </p>
                )}
                <p className="text-xs text-red-400 mt-1">
                    {relativeTime(event.occurredAt)}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {event.actionUrl && (
                    <a
                        href={event.actionUrl}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                        View →
                    </a>
                )}
                <button
                    onClick={() => onDismiss(event.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                    title="Mark read"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

function ClusterCard({ cluster }: { cluster: ActivityCluster }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-zinc-800/30">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
                <span className="text-base shrink-0">
                    {SOURCE_ICONS[cluster.source] ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                        {cluster.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {relativeTime(cluster.latestOccurredAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href={cluster.filterUrl}
                        className="text-xs text-indigo-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Filter
                    </a>
                    <span className="text-xs text-gray-400">
                        {expanded ? '▲' : '▼'}
                    </span>
                </div>
            </button>
            {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800">
                    {cluster.events.slice(0, 5).map((e) => (
                        <div
                            key={e.id}
                            className="flex items-center gap-2 px-4 py-2 border-b last:border-b-0 border-gray-50 dark:border-zinc-800/50 text-xs text-gray-600 dark:text-zinc-400"
                        >
                            <span className="shrink-0">
                                {SOURCE_ICONS[e.source] ?? '📌'}
                            </span>
                            <span className="flex-1 truncate">{e.title}</span>
                            <span className="shrink-0 tabular-nums">
                                {relativeTime(e.occurredAt)}
                            </span>
                        </div>
                    ))}
                    {cluster.events.length > 5 && (
                        <p className="px-4 py-2 text-xs text-gray-400 dark:text-zinc-500">
                            +{cluster.events.length - 5} more
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function RecommendationCard({ rec }: { rec: ActivityRecommendation }) {
    return (
        <div
            className={[
                'flex items-start gap-3 p-3 rounded-lg border',
                rec.priority === 'high'
                    ? 'border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20',
            ].join(' ')}
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-100">
                    {rec.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {rec.body}
                </p>
            </div>
            <a
                href={rec.actionUrl}
                className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
                {rec.actionLabel} →
            </a>
        </div>
    );
}

function EventRow({ event }: { event: ActivityEvent }) {
    const mutation = useActivityEventMutation();
    const isRead = !!event.readAt;
    return (
        <div
            className={[
                'group flex items-start gap-3 px-4 py-3',
                'border-b border-gray-50 dark:border-zinc-800/60',
                'hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors',
                isRead ? 'opacity-65' : '',
            ].join(' ')}
        >
            <div className="mt-2 shrink-0 w-2 h-2">
                {!isRead && (
                    <div
                        className={`w-2 h-2 rounded-full ${SEVERITY_DOT[event.severity] ?? 'bg-blue-400'}`}
                    />
                )}
            </div>
            <span className="shrink-0 text-base leading-none mt-0.5">
                {SOURCE_ICONS[event.source] ?? '📌'}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                    <p
                        className={[
                            'text-sm truncate',
                            isRead
                                ? 'text-gray-500 dark:text-zinc-400 font-normal'
                                : 'text-gray-900 dark:text-zinc-100 font-medium',
                        ].join(' ')}
                    >
                        {event.title}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0 tabular-nums">
                        {relativeTime(event.occurredAt)}
                    </span>
                </div>
                {event.body && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                        {event.body}
                    </p>
                )}
                <div className="mt-1 flex items-center gap-2">
                    <span
                        className={`text-xs font-medium capitalize ${CATEGORY_COLORS[event.category] ?? ''}`}
                    >
                        {event.source}
                    </span>
                    {event.eventType && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            {event.eventType}
                        </span>
                    )}
                    {event.severity === 'critical' && (
                        <span className="text-xs font-semibold text-red-500">
                            FAILED
                        </span>
                    )}
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {event.actionUrl && (
                    <a
                        href={event.actionUrl}
                        className="p-1 text-xs text-gray-400 hover:text-indigo-500"
                        title="Open"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ↗
                    </a>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        mutation.mutate({
                            id: event.id,
                            action: isRead ? 'unread' : 'read',
                        });
                    }}
                    className="p-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                    title={isRead ? 'Mark unread' : 'Mark read'}
                    disabled={mutation.isPending}
                >
                    {isRead ? '○' : '●'}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        mutation.mutate({
                            id: event.id,
                            action: event.isArchived ? 'unarchive' : 'archive',
                        });
                    }}
                    className="p-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                    title={event.isArchived ? 'Unarchive' : 'Archive'}
                    disabled={mutation.isPending}
                >
                    {event.isArchived ? '↩' : '×'}
                </button>
            </div>
        </div>
    );
}

export function ActivityPage() {
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [sourceFilter, setSourceFilter] = useState<ActivityEventSource | ''>(
        '',
    );
    const [categoryFilter, setCategoryFilter] = useState<
        ActivityEventCategory | ''
    >('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showClusters, setShowClusters] = useState(false);
    const bulkMutation = useActivityBulkMutation();

    const handleSearchChange = useCallback((val: string) => {
        setSearchQuery(val);
        const t = setTimeout(() => setDebouncedSearch(val), 350);
        return () => clearTimeout(t);
    }, []);

    const queryOpts = useMemo(() => {
        const base = {
            limit: 100,
            ...(sourceFilter
                ? { source: sourceFilter as ActivityEventSource }
                : {}),
            ...(categoryFilter
                ? { category: categoryFilter as ActivityEventCategory }
                : {}),
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
        };
        if (activeTab === 'unread') return { ...base, unreadOnly: true };
        if (activeTab === 'archived') return { ...base, archived: true };
        return { ...base, archived: false };
    }, [activeTab, sourceFilter, categoryFilter, debouncedSearch]);

    const {
        data: rawEvents,
        isLoading,
        isError,
        refetch,
    } = useActivityEvents(queryOpts);

    const events = useMemo(() => {
        if (activeTab !== 'failed') return rawEvents ?? [];
        return (rawEvents ?? []).filter(
            (e) =>
                e.severity === 'critical' ||
                e.eventType?.endsWith('_failed') ||
                e.eventType?.endsWith('.failed'),
        );
    }, [rawEvents, activeTab]);

    const unread = useMemo(
        () =>
            (rawEvents ?? []).filter((e) => !e.readAt && !e.isArchived).length,
        [rawEvents],
    );

    const needsAttention = useMemo(() => {
        const h72 = Date.now() - 72 * 3_600_000;
        return (rawEvents ?? [])
            .filter(
                (e) =>
                    !e.readAt &&
                    !e.isArchived &&
                    (e.severity === 'critical' || e.severity === 'warning') &&
                    new Date(e.occurredAt).getTime() > h72,
            )
            .slice(0, 5);
    }, [rawEvents]);

    const { clusters, unclustered } = useMemo(
        () => buildActivityClusters(events),
        [events],
    );
    const recommendations = useMemo(
        () => buildRecommendations(rawEvents ?? []),
        [rawEvents],
    );
    const stats = useMemo(
        () => computeSummaryStats(rawEvents ?? []),
        [rawEvents],
    );

    const displayEvents = showClusters ? unclustered : events;
    const grouped = useMemo(() => groupEvents(displayEvents), [displayEvents]);
    const hasFilters = !!sourceFilter || !!categoryFilter || !!searchQuery;

    const dismissAttention = useCallback(
        (id: string) => {
            bulkMutation.mutate({ action: 'mark-read', ids: [id] });
        },
        [bulkMutation],
    );

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {/* Header */}
            <div>
                <p className="text-xs font-semibold uppercase text-indigo-500 dark:text-indigo-300 tracking-wide">
                    Activity
                </p>
                <div className="mt-1 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                        Activity Feed
                        {unread > 0 && (
                            <span className="ml-2 text-sm font-normal text-indigo-500 dark:text-indigo-400">
                                {unread} unread
                            </span>
                        )}
                    </h1>
                    <div className="flex items-center gap-3">
                        {unread > 0 && activeTab !== 'archived' && (
                            <button
                                onClick={() =>
                                    bulkMutation.mutate({ action: 'read-all' })
                                }
                                disabled={bulkMutation.isPending}
                                className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={() => void refetch()}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Today stats */}
            {stats.cards.length > 0 && activeTab === 'all' && !hasFilters && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {stats.cards.map((c) => (
                        <div
                            key={c.key}
                            className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        >
                            <span className="text-lg">{c.icon}</span>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-none">
                                    {c.count}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {c.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Needs attention */}
            {needsAttention.length > 0 &&
                activeTab !== 'archived' &&
                !hasFilters && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-red-500 tracking-wide">
                            Needs Attention
                        </p>
                        {needsAttention.map((e) => (
                            <NeedsAttentionCard
                                key={e.id}
                                event={e}
                                onDismiss={dismissAttention}
                            />
                        ))}
                    </div>
                )}

            {/* Recommendations */}
            {recommendations.length > 0 &&
                activeTab === 'all' &&
                !hasFilters && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-indigo-500 dark:text-indigo-400 tracking-wide">
                            Recommendations
                        </p>
                        {recommendations.map((rec) => (
                            <RecommendationCard key={rec.id} rec={rec} />
                        ))}
                    </div>
                )}

            {/* Clusters */}
            {clusters.length > 0 && activeTab === 'all' && !debouncedSearch && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-gray-400 dark:text-zinc-500 tracking-wide">
                            Grouped Activity
                        </p>
                        <button
                            onClick={() => setShowClusters((v) => !v)}
                            className="text-xs text-indigo-500 hover:underline"
                        >
                            {showClusters ? 'Show all events' : 'Group similar'}
                        </button>
                    </div>
                    {showClusters &&
                        clusters.map((c) => (
                            <ClusterCard key={c.id} cluster={c} />
                        ))}
                </div>
            )}

            {/* Search + filters */}
            <div className="space-y-2">
                <input
                    type="search"
                    placeholder="Search events…"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-0.5">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={[
                                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200',
                                ].join(' ')}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sourceFilter}
                        onChange={(e) =>
                            setSourceFilter(
                                e.target.value as ActivityEventSource | '',
                            )
                        }
                        className="text-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All sources</option>
                        {ALL_SOURCES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value as ActivityEventCategory | '',
                            )
                        }
                        className="text-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All categories</option>
                        {ALL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setSourceFilter('');
                                setCategoryFilter('');
                                setSearchQuery('');
                                setDebouncedSearch('');
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 underline"
                        >
                            Clear
                        </button>
                    )}
                    {debouncedSearch && (
                        <span className="text-xs text-indigo-500 dark:text-indigo-400">
                            Searching: "{debouncedSearch}"
                        </span>
                    )}
                </div>
            </div>

            {/* Feed */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                {isLoading && (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-400 dark:text-zinc-500">
                            Loading…
                        </p>
                    </div>
                )}
                {isError && !isLoading && (
                    <div className="p-8 text-center">
                        <p className="text-sm text-red-500">
                            Failed to load activity. Try refreshing.
                        </p>
                    </div>
                )}
                {!isLoading && !isError && displayEvents.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-400 dark:text-zinc-500">
                            {debouncedSearch
                                ? `No events match "${debouncedSearch}".`
                                : hasFilters
                                  ? 'No events match the current filters.'
                                  : activeTab === 'unread'
                                    ? 'No unread events.'
                                    : activeTab === 'failed'
                                      ? 'No failed events. Everything is running cleanly.'
                                      : activeTab === 'archived'
                                        ? 'No archived events.'
                                        : 'No activity yet. Events appear here as you use the platform.'}
                        </p>
                    </div>
                )}
                {!isLoading &&
                    !isError &&
                    grouped.map(([group, groupEvts]) => (
                        <div key={group}>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                                    {group}{' '}
                                    <span className="font-normal normal-case text-gray-400 dark:text-zinc-500">
                                        — {groupEvts.length} event
                                        {groupEvts.length !== 1 ? 's' : ''}
                                    </span>
                                </p>
                            </div>
                            {groupEvts.map((event) => (
                                <EventRow key={event.id} event={event} />
                            ))}
                        </div>
                    ))}
            </div>
        </div>
    );
}
