'use client';

import { useMemo } from 'react';
import { BarChart } from '@/features/ui/visualizations/components/BarChart';
import {
    extractMetricSeries,
    calcRollingAverage,
} from '@/features/tracking/lib/analyticsEngine';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface MetricStats {
    key: string;
    label: string;
    unit?: string;
    avg: number;
    min: number;
    max: number;
    stdDev: number;
    count: number;
    weekAvg: number;
}

function calcMetricStats(
    entries: TrackingEntry[],
    category: string,
    metric: string,
    label: string,
    unit?: string,
): MetricStats | null {
    const series = extractMetricSeries(entries, category, metric);
    if (series.length === 0) return null;
    const vals = series.map((p) => p.value);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const weekAgo = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .slice(0, 10);
    const recent = series.filter((p) => p.date >= weekAgo);
    const weekAvg =
        recent.length > 0
            ? recent.reduce((s, p) => s + p.value, 0) / recent.length
            : avg;
    return {
        key: metric,
        label,
        avg,
        min,
        max,
        stdDev,
        count: vals.length,
        weekAvg,
        ...(unit !== undefined && { unit }),
    };
}

interface StatCardProps {
    stat: MetricStats;
}

function StatCard({ stat }: StatCardProps) {
    const fmt = (v: number) =>
        Math.abs(v) < 10 ? v.toFixed(1) : Math.round(v).toString();
    const u = stat.unit ? ` ${stat.unit}` : '';
    const weekDelta = stat.weekAvg - stat.avg;
    const weekPct =
        stat.avg !== 0 ? ((weekDelta / stat.avg) * 100).toFixed(0) : '0';
    const trendColor =
        weekDelta > 0
            ? 'text-green-500'
            : weekDelta < 0
              ? 'text-red-400'
              : 'text-gray-400';

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3">
                {stat.label}
            </p>
            <div className="flex items-end gap-1 mb-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    {fmt(stat.avg)}
                </span>
                {u && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">
                        {u}
                    </span>
                )}
                <span
                    className={`text-[11px] font-medium ml-1 mb-0.5 ${trendColor}`}
                >
                    {weekDelta > 0 ? '+' : ''}
                    {weekPct}% this week
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        {fmt(stat.min)}
                        {u}
                    </p>
                    <p className="text-[10px] text-gray-400">min</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        {fmt(stat.max)}
                        {u}
                    </p>
                    <p className="text-[10px] text-gray-400">max</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        ±{fmt(stat.stdDev)}
                        {u}
                    </p>
                    <p className="text-[10px] text-gray-400">std dev</p>
                </div>
            </div>
        </div>
    );
}

const BUILTIN_METRICS: Partial<
    Record<string, { metric: string; label: string; unit?: string }[]>
> = {
    sleep: [
        { metric: 'quality', label: 'Sleep Quality', unit: '/10' },
        { metric: 'durationHours', label: 'Duration', unit: 'hrs' },
    ],
    workout: [
        { metric: 'duration', label: 'Duration', unit: 'min' },
        { metric: 'intensity', label: 'Intensity', unit: '/10' },
    ],
    meal: [
        { metric: 'protein', label: 'Protein', unit: 'g' },
        { metric: 'calories', label: 'Calories', unit: 'kcal' },
    ],
    mood: [
        { metric: 'score', label: 'Mood Score', unit: '/5' },
        { metric: 'energy', label: 'Energy', unit: '/5' },
    ],
    symptom: [{ metric: 'severity', label: 'Severity', unit: '/10' }],
    injury: [{ metric: 'severity', label: 'Severity', unit: '/10' }],
};

interface StatsViewProps {
    entries: TrackingEntry[];
    category: string;
    customDef?: CustomCategoryDef | undefined;
}

export function StatsView({ entries, category, customDef }: StatsViewProps) {
    const metrics = useMemo(() => {
        if (customDef) {
            return customDef.fields
                .filter((f) => f.type === 'number' || f.type === 'range')
                .map((f) => ({ metric: f.key, label: f.label, unit: f.unit }));
        }
        return BUILTIN_METRICS[category] ?? [];
    }, [category, customDef]);

    const stats = useMemo(
        () =>
            metrics
                .map((m) =>
                    calcMetricStats(
                        entries,
                        category,
                        m.metric,
                        m.label,
                        m.unit,
                    ),
                )
                .filter((s): s is MetricStats => s !== null),
        [entries, category, metrics],
    );

    const freqData = useMemo(() => {
        const counts = new Map<string, number>();
        for (const e of entries) {
            const day = new Date(e.entryDate + 'T00:00:00').toLocaleDateString(
                'en-US',
                { weekday: 'short' },
            );
            counts.set(day, (counts.get(day) ?? 0) + 1);
        }
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((d) => ({ label: d, value: counts.get(d) ?? 0 }));
    }, [entries]);

    const rollingData = useMemo(() => {
        if (metrics.length === 0) return null;
        const firstMetric = metrics[0];
        if (!firstMetric) return null;
        const series = extractMetricSeries(
            entries,
            category,
            firstMetric.metric,
        );
        if (series.length < 3) return null;
        return {
            raw: series,
            rolling: calcRollingAverage(series, 7),
            label: firstMetric.label,
        };
    }, [entries, category, metrics]);

    if (entries.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No entries yet.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {stats.length > 0 && (
                <div
                    className={`grid gap-4 ${stats.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}
                >
                    {stats.map((s) => (
                        <StatCard key={s.key} stat={s} />
                    ))}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3">
                    Log frequency by day of week
                </p>
                <BarChart data={freqData} height={120} color="#6366f1" />
            </div>

            {rollingData && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                            7-day rolling average: {rollingData.label}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {rollingData.raw.length} data points
                        </p>
                    </div>
                    <BarChart
                        data={rollingData.rolling.map((p) => ({
                            label: p.date.slice(5),
                            value: p.value,
                        }))}
                        height={120}
                        color="#818cf8"
                    />
                </div>
            )}
        </div>
    );
}
