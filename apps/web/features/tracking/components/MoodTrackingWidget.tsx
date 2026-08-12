'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import { WidgetStat } from '@/features/tracking/components/TrackingSurface';
import {
    calcTrend,
    extractMetricSeries,
} from '@/features/tracking/lib/analyticsEngine';
import { MOOD_LABELS } from '@/features/tracking/labels';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'goal';

export default function MoodTrackingWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const { entries, refetch } = useTrackingEntries({
        category: 'mood',
        limit: 60,
    });
    const { handleAdd } = useTrackingActions(refetch);

    const moodSeries = extractMetricSeries(entries, 'mood', 'score');
    const trend = moodSeries.length > 6 ? calcTrend(moodSeries, 'week') : null;
    const sevenDayEntries = entries.filter((entry) => {
        const date = new Date(`${entry.entryDate}T00:00:00`);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 6);
        cutoff.setHours(0, 0, 0, 0);
        return date >= cutoff;
    });
    const avgMood =
        moodSeries.length > 0
            ? moodSeries.reduce((sum, item) => sum + item.value, 0) /
              moodSeries.length
            : null;
    const todayKey = new Date().toISOString().slice(0, 10);

    return (
        <WidgetShell
            icon={<Brain className="h-4 w-4 text-pink-500" />}
            title="Mood"
            footerHref="/tracking"
            footerLabel="Open mood dashboard"
            widgetId="mood-tracking-widget"
            widgetType="tracking-mood"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Mood"
                />
            }
        >
            <div className="space-y-3">
                {/* Tab bar */}
                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'goal'] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                                    tab === t
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {t === 'goal'
                                    ? 'Goal'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
                    <QuickEntryForm
                        initialCategory="mood"
                        lockCategory
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setTab('history');
                        }}
                        onCancel={() => setTab('history')}
                    />
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={entries.map((e) => e.entryDate)}
                            accentColor="pink"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {entries.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No mood entries yet.
                                </p>
                            ) : (
                                entries.slice(0, 20).map((entry) => {
                                    const score =
                                        typeof entry.metadata['score'] ===
                                        'number'
                                            ? entry.metadata['score']
                                            : null;
                                    return (
                                        <div
                                            key={entry.id}
                                            className={`rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 ${entry.entryDate === todayKey ? 'ring-1 ring-pink-400' : ''}`}
                                        >
                                            <p className="text-xs font-medium text-gray-800 dark:text-zinc-100">
                                                {score !== null
                                                    ? MOOD_LABELS[score]
                                                    : 'Mood entry'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                                {formatDate(entry.entryDate)}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <WidgetStat
                                label="This week"
                                value={String(sevenDayEntries.length)}
                            />
                            <WidgetStat
                                label="Average"
                                value={
                                    avgMood !== null
                                        ? `${avgMood.toFixed(1)}/5`
                                        : 'N/A'
                                }
                            />
                            <WidgetStat
                                label="Trend"
                                value={
                                    trend
                                        ? `${Math.round(trend.magnitude * 100)}%`
                                        : 'N/A'
                                }
                            />
                        </div>
                        <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                            {trend
                                ? `Mood is ${trend.direction} by ${Math.round(trend.magnitude * 100)}% this week.`
                                : 'Not enough data for insights yet.'}
                        </p>
                    </div>
                )}

                {tab === 'goal' && <GoalSettingsPanel category="mood" />}
            </div>
        </WidgetShell>
    );
}
