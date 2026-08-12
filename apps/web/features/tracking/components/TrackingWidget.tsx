'use client';

import { useState } from 'react';
import { ActivitySquare } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingWidgetData } from '@/features/tracking/hooks/useTrackingWidgetData';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GraphView } from '@/features/tracking/components/GraphView';
import { HeatmapView } from '@/features/tracking/components/HeatmapView';
import { StatsView } from '@/features/tracking/components/StatsView';
import { TimelineView } from '@/features/tracking/components/TimelineView';
import {
    getCategoryLabel,
    TRACKING_CATEGORIES,
} from '@/features/tracking/constants';
import type { TrackingCategory } from '@/features/tracking/types/trackingCategories';
import type { Tracker } from '@/features/recovery/types/recovery';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';
import { HabitPanel } from '@/features/habit/components/HabitPanel';

type Tab = 'add' | 'history' | 'insights' | 'lab';
const NON_ENTRY_CATEGORIES = ['recovery', 'habits'];

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
                        <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 capitalize">
                            {t.addiction}
                        </p>
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

type ActiveCategory = TrackingCategory;

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
                onClick={() => onChange('habits')}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    active === 'habits'
                        ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                        : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
            >
                Habits
            </button>
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
    const [tab, setTab] = useState<Tab>('add');
    const [activeCategory, setActiveCategory] =
        useState<ActiveCategory>('mood');
    const [showRecovery, setShowRecovery] = useState(false);

    const dataCategory: TrackingCategory = NON_ENTRY_CATEGORIES.includes(
        activeCategory,
    )
        ? 'mood'
        : activeCategory;
    const { entries, allEntries, trackers, handleAdd } =
        useTrackingWidgetData(dataCategory);

    return (
        <WidgetShell
            icon={<ActivitySquare className="h-4 w-4 text-indigo-500" />}
            title="Logging & Tracking"
            footerHref="/tracking"
            footerLabel="Open lab →"
            widgetId="tracking-widget"
            widgetType="tracking"
            headerActionsSlot={
                activeCategory === 'habits' ? (
                    <WidgetImportExportControls
                        sourceType="habits"
                        displayName="Habits"
                    />
                ) : (
                    <WidgetImportExportControls
                        sourceType="tracking_entries"
                        displayName="Tracking"
                    />
                )
            }
        >
            <div className="space-y-3">
                {/* Category picker (always visible, horizontally scrollable) */}
                <CategoryPicker
                    active={activeCategory}
                    onChange={(c) => {
                        setActiveCategory(c);
                    }}
                />

                {activeCategory === 'habits' ? (
                    <HabitPanel />
                ) : (
                    <>
                        {/* Tab bar */}
                        <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                            {(
                                ['add', 'history', 'insights', 'lab'] as const
                            ).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                                        tab === t
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {t === 'lab'
                                        ? 'Lab'
                                        : t.charAt(0).toUpperCase() +
                                          t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {tab === 'add' && (
                            <QuickEntryForm
                                initialCategory={dataCategory}
                                onSubmit={async (entry) => {
                                    await handleAdd(entry);
                                    setTab('history');
                                }}
                                onCancel={() => setTab('history')}
                            />
                        )}

                        {tab === 'history' && (
                            <div className="space-y-3">
                                <MiniHistoryChart
                                    dates={entries.map((e) => e.entryDate)}
                                    accentColor="indigo"
                                />
                                {entries.length > 0 ? (
                                    <TimelineView entries={entries} />
                                ) : (
                                    <EmptyHint action={() => setTab('add')} />
                                )}
                            </div>
                        )}

                        {tab === 'insights' && (
                            <div className="space-y-3">
                                {allEntries.length > 0 ? (
                                    <StatsView
                                        entries={allEntries}
                                        category={dataCategory}
                                    />
                                ) : (
                                    <EmptyHint action={() => setTab('add')} />
                                )}
                            </div>
                        )}

                        {tab === 'lab' && (
                            <div className="space-y-3">
                                {entries.length > 0 ? (
                                    <GraphView
                                        entries={entries}
                                        category={dataCategory}
                                    />
                                ) : (
                                    <EmptyHint action={() => setTab('add')} />
                                )}
                                {allEntries.length > 0 && (
                                    <HeatmapView
                                        entries={allEntries}
                                        category={dataCategory}
                                        weeks={8}
                                    />
                                )}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRecovery((v) => !v)
                                        }
                                        className="rounded-md bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300"
                                    >
                                        Recovery
                                    </button>
                                    {showRecovery && (
                                        <div className="mt-2">
                                            <RecoveryPanel
                                                trackers={trackers}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
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
