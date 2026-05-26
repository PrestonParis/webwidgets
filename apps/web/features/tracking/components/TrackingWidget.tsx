'use client';

import { useState } from 'react';
import {
    ActivitySquare,
    BarChart3,
    CalendarDays,
    ListPlus,
    Plus,
    TableProperties,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingWidgetData } from '@/features/tracking/hooks/useTrackingWidgetData';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import {
    QuickActionButton,
    WidgetStat,
} from '@/features/tracking/components/TrackingSurface';
import { GraphView } from '@/features/tracking/components/views/GraphView';
import { HeatmapView } from '@/features/tracking/components/views/HeatmapView';
import { StatsView } from '@/features/tracking/components/views/StatsView';
import { TimelineView } from '@/features/tracking/components/views/TimelineView';
import {
    getCategoryLabel,
    TRACKING_CATEGORIES,
} from '@/features/tracking/constants';
import type { TrackingCategory } from '@/features/tracking/types/tracking';
import type { Tracker } from '@/features/recovery/types/recovery';

type ViewMode = 'log' | 'graph' | 'heatmap' | 'stats' | 'timeline' | 'recovery';

const VIEW_LABELS: Record<ViewMode, string> = {
    log: 'Log',
    graph: 'Graph',
    heatmap: 'Heatmap',
    stats: 'Stats',
    timeline: 'Timeline',
    recovery: 'Recovery',
};

function daysSince(isoTime: string): number {
    return Math.floor((Date.now() - new Date(isoTime).getTime()) / 86_400_000);
}

function RecoveryPanel({ trackers }: { trackers: Tracker[] }) {
    if (trackers.length === 0) {
        return (
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3 text-center space-y-1">
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                    No recovery trackers yet.
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-600">
                    Add one on the Tracking page → Recovery tab.
                </p>
            </div>
        );
    }
    return (
        <div className="space-y-1.5">
            {trackers.map((t) => {
                const days = daysSince(t.start_time);
                return (
                    <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-zinc-800/60 px-3 py-2"
                    >
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 capitalize">
                                {t.addiction}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {days}
                            </p>
                            <p className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                                days
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

type ActiveCategory = TrackingCategory | 'recovery';

function CategoryPicker({
    active,
    onChange,
}: {
    active: ActiveCategory;
    onChange: (c: ActiveCategory) => void;
}) {
    return (
        <div className="flex gap-0.5 overflow-x-auto pb-0.5 no-scrollbar">
            {TRACKING_CATEGORIES.map((c) => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        active === c
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    {getCategoryLabel(c)}
                </button>
            ))}
            <button
                onClick={() => onChange('recovery')}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    active === 'recovery'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
            >
                Recovery
            </button>
        </div>
    );
}

export default function TrackingWidget() {
    const [viewMode, setViewMode] = useState<ViewMode>('log');
    const [activeCategory, setActiveCategory] =
        useState<ActiveCategory>('mood');

    const dataCategory: TrackingCategory =
        activeCategory === 'recovery' ? 'mood' : activeCategory;
    const { entries, allEntries, trackers, handleAdd } =
        useTrackingWidgetData(dataCategory);

    const isRecovery = activeCategory === 'recovery' || viewMode === 'recovery';
    const setTrackingView = (next: ViewMode) => {
        setViewMode(next);
        setActiveCategory((current) =>
            next === 'recovery'
                ? 'recovery'
                : current === 'recovery'
                  ? 'mood'
                  : current,
        );
    };

    return (
        <WidgetShell
            icon={<ActivitySquare className="h-4 w-4 text-indigo-500" />}
            title="Tracking"
            footerHref="/tracking"
            footerLabel="Open lab →"
            widgetId="tracking-widget"
            widgetType="tracking"
        >
            <div className="space-y-3">
                {/* Category picker (always visible) */}
                <CategoryPicker
                    active={activeCategory}
                    onChange={(c) => {
                        setActiveCategory(c);
                        setViewMode(c === 'recovery' ? 'recovery' : 'log');
                    }}
                />

                {!isRecovery && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <p className="text-[10px] font-semibold uppercase text-indigo-500 dark:text-indigo-300">
                            Active tracker
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {getCategoryLabel(dataCategory)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {entries.length} recent entries ·{' '}
                            {allEntries.length} total in range
                        </p>
                    </div>
                )}

                {!isRecovery && (
                    <div className="grid grid-cols-3 gap-2">
                        <WidgetStat
                            label="Recent"
                            value={String(entries.length)}
                        />
                        <WidgetStat
                            label="All"
                            value={String(allEntries.length)}
                        />
                        <WidgetStat
                            label="View"
                            value={VIEW_LABELS[viewMode]}
                        />
                    </div>
                )}

                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'log'}
                        onClick={() => setTrackingView('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'graph'}
                        onClick={() => setTrackingView('graph')}
                    >
                        <BarChart3 className="h-3 w-3" /> Graph
                    </QuickActionButton>
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'timeline'}
                        onClick={() => setTrackingView('timeline')}
                    >
                        <ListPlus className="h-3 w-3" /> Timeline
                    </QuickActionButton>
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'stats'}
                        onClick={() => setTrackingView('stats')}
                    >
                        <TableProperties className="h-3 w-3" /> Stats
                    </QuickActionButton>
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'heatmap'}
                        onClick={() => setTrackingView('heatmap')}
                    >
                        <CalendarDays className="h-3 w-3" /> Heatmap
                    </QuickActionButton>
                    <QuickActionButton
                        tone="indigo"
                        primary={viewMode === 'recovery'}
                        onClick={() => setTrackingView('recovery')}
                    >
                        Recovery
                    </QuickActionButton>
                </div>

                {/* View content */}
                {!isRecovery &&
                    viewMode === 'graph' &&
                    (entries.length > 0 ? (
                        <GraphView entries={entries} category={dataCategory} />
                    ) : (
                        <EmptyHint action={() => setTrackingView('log')} />
                    ))}
                {!isRecovery &&
                    viewMode === 'heatmap' &&
                    (allEntries.length > 0 ? (
                        <HeatmapView
                            entries={allEntries}
                            category={dataCategory}
                            weeks={8}
                        />
                    ) : (
                        <EmptyHint action={() => setTrackingView('log')} />
                    ))}
                {!isRecovery &&
                    viewMode === 'stats' &&
                    (allEntries.length > 0 ? (
                        <StatsView
                            entries={allEntries}
                            category={dataCategory}
                        />
                    ) : (
                        <EmptyHint action={() => setTrackingView('log')} />
                    ))}
                {!isRecovery &&
                    viewMode === 'timeline' &&
                    (entries.length > 0 ? (
                        <TimelineView entries={entries} />
                    ) : (
                        <EmptyHint action={() => setTrackingView('log')} />
                    ))}
                {isRecovery && <RecoveryPanel trackers={trackers} />}

                {!isRecovery && viewMode === 'log' && (
                    <QuickEntryForm
                        initialCategory={dataCategory}
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setTrackingView('log');
                        }}
                        onCancel={() => setTrackingView('log')}
                    />
                )}
            </div>
        </WidgetShell>
    );
}

function EmptyHint({ action }: { action: () => void }) {
    return (
        <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3 text-center space-y-2">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                No data for this category yet.
            </p>
            <button
                onClick={action}
                className="text-[11px] text-indigo-500 hover:text-indigo-600 transition-colors"
            >
                + Log first entry →
            </button>
        </div>
    );
}
