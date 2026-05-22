'use client';

import { useState } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingWidgetData } from '@/features/tracking/hooks/useTrackingWidgetData';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
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

type ViewMode = 'graph' | 'heatmap' | 'stats' | 'timeline';

const VIEWS: Array<{ id: ViewMode; label: string }> = [
    { id: 'graph', label: 'Graph' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'stats', label: 'Stats' },
    { id: 'timeline', label: 'Timeline' },
];

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
                            <span className="text-sm">🌱</span>
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
    const [viewMode, setViewMode] = useState<ViewMode>('graph');
    const [activeCategory, setActiveCategory] =
        useState<ActiveCategory>('mood');
    const [showForm, setShowForm] = useState(false);

    const dataCategory: TrackingCategory =
        activeCategory === 'recovery' ? 'mood' : activeCategory;
    const { entries, allEntries, trackers, handleAdd } =
        useTrackingWidgetData(dataCategory);

    const isRecovery = activeCategory === 'recovery';

    return (
        <WidgetShell
            icon={<span className="text-base">📊</span>}
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
                        setShowForm(false);
                    }}
                />

                {/* View mode dropdown (hidden in recovery) */}
                {!isRecovery && (
                    <select
                        value={viewMode}
                        onChange={(e) => {
                            setViewMode(e.target.value as ViewMode);
                            setShowForm(false);
                        }}
                        className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-700 dark:text-zinc-300"
                    >
                        {VIEWS.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Entry count (non-recovery) */}
                {!isRecovery && (
                    <p className="text-xs text-gray-400 dark:text-zinc-600">
                        {entries.length} entries
                    </p>
                )}

                {/* View content */}
                {!isRecovery &&
                    viewMode === 'graph' &&
                    (entries.length > 0 ? (
                        <GraphView entries={entries} category={dataCategory} />
                    ) : (
                        <EmptyHint action={() => setShowForm(true)} />
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
                        <EmptyHint action={() => setShowForm(true)} />
                    ))}
                {!isRecovery &&
                    viewMode === 'stats' &&
                    (allEntries.length > 0 ? (
                        <StatsView
                            entries={allEntries}
                            category={dataCategory}
                        />
                    ) : (
                        <EmptyHint action={() => setShowForm(true)} />
                    ))}
                {!isRecovery &&
                    viewMode === 'timeline' &&
                    (entries.length > 0 ? (
                        <TimelineView entries={entries} />
                    ) : (
                        <EmptyHint action={() => setShowForm(true)} />
                    ))}
                {isRecovery && <RecoveryPanel trackers={trackers} />}

                {/* Quick log form (non-recovery) */}
                {!isRecovery &&
                    (showForm ? (
                        <QuickEntryForm
                            initialCategory={dataCategory}
                            onSubmit={async (entry) => {
                                await handleAdd(entry);
                                setShowForm(false);
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full text-xs py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                        >
                            + Log entry
                        </button>
                    ))}
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
