'use client';

import { useState, useMemo } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingStats } from '@/features/tracking/hooks/useTrackingStats';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { calcGoalProgress } from '@/features/tracking/lib/analyticsEngine';
import { StreakCard } from '@/features/tracking/viz/StreakCard';
import { Heatmap } from '@/features/tracking/viz/Heatmap';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import {
    formatMetadataDisplay,
    formatDate,
} from '@/features/tracking/lib/trackingUtils';

const sleepColorFn = (v: number): string => {
    if (v === 0) return '#f4f4f5';
    if (v === 1) return '#93c5fd';
    return '#3b82f6';
};

export default function SleepWidget() {
    const [showForm, setShowForm] = useState(false);
    const [showGoal, setShowGoal] = useState(false);
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
    const heatmapData = entries.map((e) => ({ date: e.entryDate, value: 1 }));
    const latest = entries[0];

    return (
        <WidgetShell
            icon={<span className="text-base">😴</span>}
            title="Sleep"
            footerHref="/tracking"
            footerLabel="View all →"
            widgetId="sleep-widget"
            widgetType="tracking-sleep"
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <StreakCard
                        current={currentStreak}
                        longest={longestStreak}
                        label="Sleep"
                        emoji="😴"
                        className="flex-1"
                    />
                    {goalProgress?.today !== undefined && (
                        <span
                            className={`text-xl mt-1 ${goalProgress.today ? 'text-green-500' : 'text-gray-300 dark:text-zinc-600'}`}
                        >
                            {goalProgress.today ? '✓' : '○'}
                        </span>
                    )}
                </div>

                {goal && (
                    <p className="text-[10px] text-indigo-400">
                        Goal: ≥{goal.targetValue}h ·{' '}
                        {goal.targetType === 'daily_min' ? 'per night' : ''}
                    </p>
                )}

                <Heatmap data={heatmapData} weeks={12} colorFn={sleepColorFn} />

                {latest && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5">
                        <p className="text-[10px] text-blue-400 dark:text-blue-300">
                            Last · {formatDate(latest.entryDate)}
                        </p>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-200 mt-0.5 truncate">
                            {formatMetadataDisplay('sleep', latest.metadata)}
                        </p>
                    </div>
                )}

                {showGoal && <GoalSettingsPanel category="sleep" />}

                {showForm ? (
                    <QuickEntryForm
                        initialCategory="sleep"
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex-1 text-xs py-1.5 rounded-lg border border-dashed border-blue-200 dark:border-blue-800 text-blue-400 hover:border-blue-400 transition-colors"
                        >
                            + Log sleep
                        </button>
                        <button
                            onClick={() => setShowGoal((v) => !v)}
                            className="text-xs px-2 py-1.5 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
                        >
                            {goal ? '⚙' : '+ Goal'}
                        </button>
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
