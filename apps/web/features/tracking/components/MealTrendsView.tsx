'use client';

import { useMemo } from 'react';
import { computeMealAnalytics } from '@/features/tracking/lib/meal/analytics';
import { BarChart } from '@/features/ui/visualizations/components/BarChart';
import type { MealRecord } from '@/features/tracking/types/meal';

interface MealTrendsViewProps {
    records: MealRecord[];
    calorieTarget: number | null;
    proteinMin: number | null;
}

export function MealTrendsView({
    records,
    calorieTarget,
    proteinMin,
}: MealTrendsViewProps) {
    const barData = useMemo(() => {
        const days: { label: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const total = records
                .filter((r) => r.date === key)
                .reduce((s, r) => s + (r.calories ?? 0), 0);
            days.push({ label, value: total });
        }
        return days;
    }, [records]);

    const analytics = useMemo(
        () => computeMealAnalytics(records, { calorieTarget, proteinMin }),
        [records, calorieTarget, proteinMin],
    );

    if (records.length < 3) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                Log at least 3 meals to see trends.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        7-day avg calories
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-0.5">
                        {analytics.sevenDayAvgCalories !== null
                            ? `${Math.round(analytics.sevenDayAvgCalories)} kcal`
                            : 'N/A'}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        7-day avg protein
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-0.5">
                        {analytics.sevenDayAvgProtein !== null
                            ? `${Math.round(analytics.sevenDayAvgProtein)}g`
                            : 'N/A'}
                    </p>
                </div>
            </div>
            {analytics.goalCalorieHitRate7d !== null && (
                <div className="text-xs text-gray-600 dark:text-zinc-400">
                    Hit calorie goal{' '}
                    <span className="font-semibold text-green-500">
                        {Math.round(analytics.goalCalorieHitRate7d * 100)}%
                    </span>{' '}
                    of days this week
                </div>
            )}
            <div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-2">
                    Calories (last 7 days)
                </p>
                <BarChart
                    data={barData.filter((d) => d.value > 0)}
                    color="#22c55e"
                    height={120}
                    emptyMessage="No calorie data yet"
                />
            </div>
        </div>
    );
}
