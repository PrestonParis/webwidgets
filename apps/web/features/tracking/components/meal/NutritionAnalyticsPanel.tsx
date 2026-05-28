'use client';

import { useMemo } from 'react';
import { BarChart } from '@/features/tracking/viz/BarChart';
import { LineChart } from '@/features/tracking/viz/LineChart';
import { computeExtendedAnalytics } from '@/features/tracking/lib/meal/nutrition/analytics';
import { buildExtendedInsights } from '@/features/tracking/lib/meal/nutrition/insights';
import { MEAL_TYPE_LABELS } from '@/features/tracking/lib/meal/helpers';
import type { MealRecord, MealType } from '@/features/tracking/lib/meal/types';
import type { NutritionGoalConfig } from '@/features/tracking/lib/meal/nutrition/goalTypes';

interface NutritionAnalyticsPanelProps {
    records: MealRecord[];
    goals: NutritionGoalConfig;
}

function StatCard({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub?: string | undefined;
    accent?: string | undefined;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide font-medium text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p
                className={`text-lg font-bold mt-0.5 ${accent ?? 'text-gray-800 dark:text-zinc-200'}`}
            >
                {value}
            </p>
            {sub && (
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {sub}
                </p>
            )}
        </div>
    );
}

function trendLabel(
    trend: 'up' | 'down' | 'stable' | null,
): string | undefined {
    if (trend === 'up') return '↑ Trending up';
    if (trend === 'down') return '↓ Trending down';
    if (trend === 'stable') return '→ Stable';
    return undefined;
}

export function NutritionAnalyticsPanel({
    records,
    goals,
}: NutritionAnalyticsPanelProps) {
    const analytics = useMemo(
        () => computeExtendedAnalytics(records, goals),
        [records, goals],
    );
    const insights = useMemo(
        () => buildExtendedInsights(analytics, goals),
        [analytics, goals],
    );

    const calBarData = useMemo(() => {
        const dates = Array.from(new Set(records.map((r) => r.date)))
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 30)
            .reverse();
        return dates
            .map((d) => ({
                label: new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                }),
                value: records
                    .filter((r) => r.date === d)
                    .reduce((s, r) => s + (r.calories ?? 0), 0),
            }))
            .filter((d) => d.value > 0);
    }, [records]);

    const proteinLineData = useMemo(() => {
        const dates = Array.from(new Set(records.map((r) => r.date)))
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 60)
            .reverse();
        return dates
            .map((d) => ({
                date: d,
                value: records
                    .filter((r) => r.date === d)
                    .reduce((s, r) => s + (r.proteinGrams ?? 0), 0),
            }))
            .filter((d) => d.value > 0);
    }, [records]);

    const { macroSplit7d } = analytics;
    const hasMacro =
        macroSplit7d.proteinPct + macroSplit7d.carbsPct + macroSplit7d.fatPct >
        0;

    if (records.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-10">
                No meal data yet. Log meals to unlock analytics.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="7-day avg calories"
                    value={
                        analytics.sevenDayAvgCalories !== null
                            ? `${Math.round(analytics.sevenDayAvgCalories)}`
                            : '—'
                    }
                    sub={trendLabel(analytics.caloriesTrend)}
                />
                <StatCard
                    label="30-day avg calories"
                    value={
                        analytics.thirtyDayAvgCalories !== null
                            ? `${Math.round(analytics.thirtyDayAvgCalories)}`
                            : '—'
                    }
                />
                <StatCard
                    label="7-day avg protein"
                    value={
                        analytics.sevenDayAvgProtein !== null
                            ? `${Math.round(analytics.sevenDayAvgProtein)}g`
                            : '—'
                    }
                    sub={trendLabel(analytics.proteinTrend)}
                    accent="text-blue-500 dark:text-blue-400"
                />
                <StatCard
                    label="Meals / day (7d)"
                    value={
                        analytics.mealsPerDayAvg7d !== null
                            ? analytics.mealsPerDayAvg7d.toFixed(1)
                            : '—'
                    }
                />
                <StatCard
                    label="Calorie goal hit (7d)"
                    value={
                        analytics.goalHitRate7d !== null
                            ? `${Math.round(analytics.goalHitRate7d * 100)}%`
                            : 'No goal'
                    }
                />
                <StatCard
                    label="Protein goal hit (7d)"
                    value={
                        analytics.proteinHitRate7d !== null
                            ? `${Math.round(analytics.proteinHitRate7d * 100)}%`
                            : 'No goal'
                    }
                />
                <StatCard
                    label="Days logged (7d)"
                    value={`${analytics.daysWithData7d}/7`}
                    sub={
                        analytics.skippedDays7d > 0
                            ? `${analytics.skippedDays7d} skipped`
                            : undefined
                    }
                />
                <StatCard
                    label="Under-protein days"
                    value={String(analytics.underProteinDays7d)}
                    sub={
                        goals.proteinMin
                            ? `vs ${goals.proteinMin}g goal`
                            : 'No goal'
                    }
                />
            </div>

            {/* Macro split */}
            {hasMacro && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        Macro split (last 7 days)
                    </p>
                    <div
                        className="flex h-4 rounded-full overflow-hidden"
                        role="img"
                        aria-label={`Macro split: ${macroSplit7d.proteinPct}% protein, ${macroSplit7d.carbsPct}% carbs, ${macroSplit7d.fatPct}% fat`}
                    >
                        <div
                            className="bg-blue-500"
                            style={{ width: `${macroSplit7d.proteinPct}%` }}
                        />
                        <div
                            className="bg-amber-400"
                            style={{ width: `${macroSplit7d.carbsPct}%` }}
                        />
                        <div
                            className="bg-rose-400"
                            style={{ width: `${macroSplit7d.fatPct}%` }}
                        />
                    </div>
                    <div className="flex gap-4 mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
                        <span>
                            <span
                                className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1"
                                aria-hidden
                            />
                            Protein {macroSplit7d.proteinPct}%
                        </span>
                        <span>
                            <span
                                className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1"
                                aria-hidden
                            />
                            Carbs {macroSplit7d.carbsPct}%
                        </span>
                        <span>
                            <span
                                className="inline-block w-2 h-2 rounded-sm bg-rose-400 mr-1"
                                aria-hidden
                            />
                            Fat {macroSplit7d.fatPct}%
                        </span>
                    </div>
                </div>
            )}

            {/* Calorie chart */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                    Daily calories — last 30 days
                </p>
                <BarChart
                    data={calBarData}
                    color="#22c55e"
                    height={180}
                    emptyMessage="No calorie data yet"
                />
            </div>

            {/* Protein trend */}
            {proteinLineData.length >= 5 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                        Daily protein trend
                    </p>
                    <LineChart
                        data={proteinLineData}
                        color="#3b82f6"
                        height={160}
                        emptyMessage="Not enough data"
                    />
                </div>
            )}

            {/* Most frequent foods */}
            {analytics.mostFrequentFoods.length > 0 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        Most logged foods
                    </p>
                    <ul className="space-y-1">
                        {analytics.mostFrequentFoods.map((f) => (
                            <li
                                key={f.name}
                                className="flex justify-between text-xs text-gray-600 dark:text-zinc-400"
                            >
                                <span className="truncate">{f.name}</span>
                                <span className="text-gray-400 dark:text-zinc-500 shrink-0 ml-2">
                                    {f.count}×
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Insights */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Insights
                </p>
                <div className="space-y-2">
                    {insights.map((insight, i) => (
                        <div
                            key={i}
                            className="flex gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
                        >
                            <span
                                className="text-base shrink-0 mt-0.5"
                                aria-hidden
                            >
                                💡
                            </span>
                            <p className="text-sm text-gray-700 dark:text-zinc-300">
                                {insight}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function mealTypeLabel(type: MealType): string {
    return MEAL_TYPE_LABELS[type];
}
