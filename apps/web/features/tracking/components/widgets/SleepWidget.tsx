'use client';

import { useState, useMemo } from 'react';
import {
    BarChart3,
    Bed,
    CalendarDays,
    History,
    Moon,
    Plus,
    Target,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingStats } from '@/features/tracking/hooks/useTrackingStats';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { calcGoalProgress } from '@/features/tracking/lib/analyticsEngine';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import {
    QuickActionButton,
    WidgetStat,
} from '@/features/tracking/components/TrackingSurface';
import {
    formatMetadataDisplay,
    formatDate,
} from '@/features/tracking/lib/trackingUtils';

type ViewMode = 'log' | 'today' | 'goal' | 'history' | 'trends' | 'summary';

export default function SleepWidget() {
    const [mode, setMode] = useState<ViewMode>('log');
    const { entries, refetch } = useTrackingEntries({
        category: 'sleep',
        limit: 100,
    });
    const { handleAdd } = useTrackingActions(refetch);
    const stats = useTrackingStats(entries, 'sleep');
    const { goal } = useTrackingGoals('sleep');
    const goalProgress = useMemo(
        () => (goal ? calcGoalProgress(entries, goal) : null),
        [entries, goal],
    );

    const currentStreak = goalProgress?.currentStreak ?? stats.currentStreak;
    const longestStreak = goalProgress?.longestStreak ?? stats.longestStreak;
    const latest = entries[0];
    const goalRatio = goalProgress?.weekProgress
        ? goalProgress.weekProgress.count /
          Math.max(1, goalProgress.weekProgress.target)
        : goalProgress?.today
          ? 1
          : 0;
    const sevenDayCount = entries.filter((entry) => {
        const date = new Date(`${entry.entryDate}T00:00:00`);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 6);
        cutoff.setHours(0, 0, 0, 0);
        return date >= cutoff;
    }).length;
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayEntry = entries.find((entry) => entry.entryDate === todayKey);

    return (
        <WidgetShell
            icon={<Moon className="h-4 w-4 text-blue-500" />}
            title="Sleep"
            footerHref="/tracking"
            footerLabel="Open sleep dashboard"
            widgetId="sleep-widget"
            widgetType="tracking-sleep"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Sleep"
                />
            }
        >
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'log'}
                        onClick={() => setMode('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'today'}
                        onClick={() => setMode('today')}
                    >
                        <Bed className="h-3 w-3" /> Today
                    </QuickActionButton>
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'goal'}
                        onClick={() => setMode('goal')}
                    >
                        <Target className="h-3 w-3" /> Goal
                    </QuickActionButton>
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'history'}
                        onClick={() => setMode('history')}
                    >
                        <History className="h-3 w-3" /> History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'trends'}
                        onClick={() => setMode('trends')}
                    >
                        <BarChart3 className="h-3 w-3" /> Trends
                    </QuickActionButton>
                    <QuickActionButton
                        tone="blue"
                        primary={mode === 'summary'}
                        onClick={() => setMode('summary')}
                    >
                        <CalendarDays className="h-3 w-3" /> Summary
                    </QuickActionButton>
                </div>

                {mode === 'log' && (
                    <QuickEntryForm
                        initialCategory="sleep"
                        lockCategory
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setMode('summary');
                        }}
                        onCancel={() => setMode('summary')}
                    />
                )}

                {mode === 'goal' && <GoalSettingsPanel category="sleep" />}

                {mode === 'summary' && (
                    <div className="space-y-3">
                        {latest ? (
                            <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                                <p className="text-[10px] font-semibold uppercase text-blue-500 dark:text-blue-300">
                                    Latest sleep
                                </p>
                                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {formatMetadataDisplay(
                                        'sleep',
                                        latest.metadata,
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {formatDate(latest.entryDate)}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-blue-200 p-3 dark:border-blue-900">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Log your first sleep entry
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Track duration, quality, streaks, and goal
                                    consistency.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <WidgetStat
                                label="This week"
                                value={`${sevenDayCount}/7`}
                            />
                            <WidgetStat
                                label="Current streak"
                                value={`${currentStreak}d`}
                            />
                            <WidgetStat
                                label="Best streak"
                                value={`${longestStreak}d`}
                            />
                        </div>

                        {goal && goalProgress && (
                            <div>
                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                                    <span>
                                        Goal: at least {goal.targetValue}h
                                    </span>
                                    <span>{Math.round(goalRatio * 100)}%</span>
                                </div>
                                <div
                                    className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                                    aria-label={`Sleep goal progress ${Math.round(goalRatio * 100)} percent`}
                                >
                                    <div
                                        className="h-2 rounded-full bg-blue-500"
                                        style={{
                                            width: `${Math.min(100, Math.round(goalRatio * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                            {latest
                                ? `You have ${sevenDayCount} sleep entries this week.`
                                : 'Not enough data for insights yet.'}
                        </p>
                    </div>
                )}
                {mode === 'today' && (
                    <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                        {todayEntry
                            ? formatMetadataDisplay(
                                  'sleep',
                                  todayEntry.metadata,
                              )
                            : goalProgress?.today
                              ? 'Today is counted toward your sleep goal.'
                              : 'No sleep entry counted for today yet.'}
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
                                        'sleep',
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
                        {entries.length < 2
                            ? 'Not enough data yet.'
                            : `Current streak: ${currentStreak} days · longest streak: ${longestStreak} days.`}
                    </p>
                )}
            </div>
        </WidgetShell>
    );
}
