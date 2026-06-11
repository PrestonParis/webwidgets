'use client';

import { useState, useMemo } from 'react';
import { Moon } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingStats } from '@/features/tracking/hooks/useTrackingStats';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { calcGoalProgress } from '@/features/tracking/lib/analyticsEngine';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import { WidgetStat } from '@/features/tracking/components/TrackingSurface';
import {
    formatMetadataDisplay,
    formatDate,
} from '@/features/tracking/lib/trackingUtils';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'goal';

export default function SleepWidget() {
    const [tab, setTab] = useState<Tab>('add');
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
                        initialCategory="sleep"
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
                            accentColor="blue"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {entries.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No sleep entries yet.
                                </p>
                            ) : (
                                entries.slice(0, 20).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 ${entry.entryDate === todayKey ? 'ring-1 ring-blue-400' : ''}`}
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
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <WidgetStat
                                label="This week"
                                value={`${sevenDayCount}/7`}
                            />
                            <WidgetStat
                                label="Streak"
                                value={`${currentStreak}d`}
                            />
                            <WidgetStat
                                label="Best"
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
                            {entries.length > 0
                                ? `You have ${sevenDayCount} sleep entries this week.`
                                : 'Not enough data for insights yet.'}
                        </p>
                    </div>
                )}

                {tab === 'goal' && <GoalSettingsPanel category="sleep" />}
            </div>
        </WidgetShell>
    );
}
