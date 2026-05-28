'use client';

import { useState, useMemo } from 'react';
import { LineChart } from '@/features/tracking/viz/LineChart';
import {
    extractMetricSeries,
    calcRollingAverage,
} from '@/features/tracking/lib/analyticsEngine';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface GraphViewProps {
    entries: TrackingEntry[];
    category: string;
    customDef?: CustomCategoryDef | undefined;
}

type MetricDef = { metric: string; label: string; color?: string };

const BUILTIN_METRICS: Partial<Record<string, MetricDef[]>> = {
    sleep: [
        { metric: 'quality', label: 'Sleep Quality', color: '#6366f1' },
        { metric: 'durationHours', label: 'Duration (hrs)', color: '#818cf8' },
    ],
    workout: [
        { metric: 'duration', label: 'Duration (min)', color: '#f97316' },
        { metric: 'intensity', label: 'Intensity', color: '#fb923c' },
    ],
    meal: [
        { metric: 'protein', label: 'Protein (g)', color: '#22c55e' },
        { metric: 'calories', label: 'Calories', color: '#86efac' },
    ],
    mood: [
        { metric: 'score', label: 'Mood Score', color: '#ec4899' },
        { metric: 'energy', label: 'Energy', color: '#f9a8d4' },
    ],
    symptom: [{ metric: 'severity', label: 'Severity', color: '#f59e0b' }],
    injury: [{ metric: 'severity', label: 'Severity', color: '#ef4444' }],
};

export function GraphView({ entries, category, customDef }: GraphViewProps) {
    const [showRolling, setShowRolling] = useState(false);

    const metrics: MetricDef[] = useMemo(() => {
        if (customDef) {
            return customDef.fields
                .filter((f) => f.type === 'number' || f.type === 'range')
                .map((f) => ({ metric: f.key, label: f.label }));
        }
        return BUILTIN_METRICS[category] ?? [];
    }, [category, customDef]);

    const series = useMemo(
        () =>
            metrics.map((m) => {
                const raw = extractMetricSeries(entries, category, m.metric);
                const data =
                    showRolling && raw.length >= 3
                        ? calcRollingAverage(raw, 7)
                        : raw;
                return { ...m, data };
            }),
        [entries, category, metrics, showRolling],
    );

    if (metrics.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No numeric metrics available for this category.
            </p>
        );
    }

    const anyData = series.some((s) => s.data.length > 1);
    if (!anyData) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                Not enough data yet — log at least 2 entries to see a graph.
            </p>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowRolling((v) => !v)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${showRolling ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-indigo-400'}`}
                >
                    7-day rolling avg
                </button>
            </div>
            {series.map(
                (s) =>
                    s.data.length > 1 && (
                        <div
                            key={s.metric}
                            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4"
                        >
                            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">
                                {s.label}
                            </p>
                            <LineChart
                                data={s.data}
                                label={s.label}
                                {...(s.color !== undefined && {
                                    color: s.color,
                                })}
                                height={160}
                            />
                        </div>
                    ),
            )}
        </div>
    );
}
