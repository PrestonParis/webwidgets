'use client';

import { useState } from 'react';
import {
    BarChart3,
    Brain,
    CalendarDays,
    History,
    Plus,
    Smile,
    Target,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import {
    QuickActionButton,
    WidgetStat,
} from '@/features/tracking/components/TrackingSurface';
import {
    calcTrend,
    extractMetricSeries,
} from '@/features/tracking/lib/analyticsEngine';
import { MOOD_EMOJIS, MOOD_LABELS } from '@/features/tracking/labels';
import {
    formatDate,
    formatMetadataDisplay,
} from '@/features/tracking/lib/trackingUtils';

type ViewMode = 'log' | 'today' | 'goal' | 'history' | 'trends' | 'summary';

export default function MoodTrackingWidget() {
    const [mode, setMode] = useState<ViewMode>('log');
    const { entries, refetch } = useTrackingEntries({
        category: 'mood',
        limit: 60,
    });
    const { handleAdd } = useTrackingActions(refetch);

    const latest = entries[0];
    const latestScore =
        typeof latest?.metadata['score'] === 'number'
            ? latest.metadata['score']
            : null;

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

    return (
        <WidgetShell
            icon={<Brain className="h-4 w-4 text-pink-500" />}
            title="Mood"
            footerHref="/tracking"
            footerLabel="Open mood dashboard"
            widgetId="mood-tracking-widget"
            widgetType="tracking-mood"
        >
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'log'}
                        onClick={() => setMode('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'today'}
                        onClick={() => setMode('today')}
                    >
                        <Smile className="h-3 w-3" /> Today
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'goal'}
                        onClick={() => setMode('goal')}
                    >
                        <Target className="h-3 w-3" /> Goal
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'history'}
                        onClick={() => setMode('history')}
                    >
                        <History className="h-3 w-3" /> History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'trends'}
                        onClick={() => setMode('trends')}
                    >
                        <BarChart3 className="h-3 w-3" /> Trends
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'summary'}
                        onClick={() => setMode('summary')}
                    >
                        <CalendarDays className="h-3 w-3" /> Summary
                    </QuickActionButton>
                </div>

                {mode === 'log' && (
                    <QuickEntryForm
                        initialCategory="mood"
                        lockCategory
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setMode('summary');
                        }}
                        onCancel={() => setMode('summary')}
                    />
                )}
                {mode === 'goal' && <GoalSettingsPanel category="mood" />}

                {mode === 'summary' && (
                    <div className="space-y-3">
                        {latestScore !== null ? (
                            <div className="rounded-xl border border-pink-100 bg-pink-50/80 p-3 dark:border-pink-900/50 dark:bg-pink-950/20">
                                <p className="text-[10px] font-semibold uppercase text-pink-500 dark:text-pink-300">
                                    Latest mood
                                </p>
                                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {MOOD_EMOJIS[latestScore]}{' '}
                                    {MOOD_LABELS[latestScore]}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {latest
                                        ? formatDate(latest.entryDate)
                                        : 'No date'}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-pink-200 p-3 dark:border-pink-900">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Log your first mood
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Track mood, notes, and trends over time.
                                </p>
                            </div>
                        )}
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
                                        : '—'
                                }
                            />
                            <WidgetStat
                                label="Trend"
                                value={
                                    trend
                                        ? `${Math.round(trend.magnitude * 100)}%`
                                        : '—'
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
                {mode === 'today' && (
                    <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                        {latest?.entryDate ===
                        new Date().toISOString().slice(0, 10)
                            ? formatMetadataDisplay('mood', latest.metadata)
                            : 'No mood logged today yet.'}
                    </p>
                )}
                {mode === 'history' && (
                    <div className="space-y-1">
                        {entries.slice(0, 5).map((entry) => (
                            <div
                                key={entry.id}
                                className="rounded-lg bg-gray-50 p-2 dark:bg-zinc-800/70"
                            >
                                <p className="text-xs font-medium text-gray-800 dark:text-zinc-100">
                                    {formatMetadataDisplay(
                                        'mood',
                                        entry.metadata,
                                    )}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                    {formatDate(entry.entryDate)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                {mode === 'trends' && (
                    <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                        {trend
                            ? `Weekly trend: ${trend.direction} · ${Math.round(trend.magnitude * 100)}% change.`
                            : 'Log at least 7 mood entries to see trends.'}
                    </p>
                )}
            </div>
        </WidgetShell>
    );
}
