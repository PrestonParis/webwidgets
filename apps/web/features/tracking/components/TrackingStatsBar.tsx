'use client';

import { useMemo } from 'react';
import { useTrackingStats } from '@/features/tracking/hooks/useTrackingStats';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { calcGoalProgress } from '@/features/tracking/lib/analyticsEngine';
import { StreakCard } from '@/features/tracking/viz/StreakCard';
import {
    getCategoryLabel,
    getCategoryEmoji,
} from '@/features/tracking/constants';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface TrackingStatsBarProps {
    category: string;
    entries: TrackingEntry[];
    customDefs: CustomCategoryDef[];
}

export function TrackingStatsBar({
    category,
    entries,
    customDefs,
}: TrackingStatsBarProps) {
    const stats = useTrackingStats(entries, category);
    const { goal } = useTrackingGoals(category);
    const goalProgress = useMemo(
        () => (goal ? calcGoalProgress(entries, goal) : null),
        [entries, goal],
    );

    const currentStreak = goalProgress?.currentStreak ?? stats.currentStreak;
    const longestStreak = goalProgress?.longestStreak ?? stats.longestStreak;

    return (
        <div className="flex gap-4 flex-wrap items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <StreakCard
                current={currentStreak}
                longest={longestStreak}
                label={getCategoryLabel(category, customDefs)}
                emoji={getCategoryEmoji(category, customDefs)}
            />
            <div className="flex gap-4 flex-wrap items-start">
                {goalProgress?.today !== undefined && (
                    <div className="text-center">
                        <span
                            className={`text-lg ${goalProgress.today ? 'text-green-500' : 'text-gray-400 dark:text-zinc-500'}`}
                        >
                            {goalProgress.today ? '✓' : '○'}
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Today
                        </p>
                    </div>
                )}
                {goalProgress?.weekProgress ? (
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                            {goalProgress.weekProgress.count}/
                            {goalProgress.weekProgress.target}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            This week
                        </p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                            {stats.weeklyCount}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            This week
                        </p>
                    </div>
                )}
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                        {stats.monthlyCount}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        This month
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                        {stats.count}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        All time
                    </p>
                </div>
                {goal && (
                    <div className="self-center">
                        <p className="text-[10px] text-indigo-400 font-medium">
                            {goal.targetType === 'daily_min'
                                ? `Goal: ≥${goal.targetValue} ${goal.metricKey ?? ''}`
                                : goal.targetType === 'weekly_count'
                                  ? `Goal: ${goal.targetValue}×/wk`
                                  : 'Goal: log daily'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
