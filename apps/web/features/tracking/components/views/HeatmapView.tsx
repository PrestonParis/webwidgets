'use client';

import { useMemo } from 'react';
import { Heatmap } from '@/features/tracking/viz/Heatmap';
import { getCategoryColor } from '@/features/tracking/constants';
import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface HeatmapViewProps {
    entries: TrackingEntry[];
    category: string;
    weeks?: number;
    customDefs?: CustomCategoryDef[];
}

const COLOR_MAP: Record<string, string[]> = {
    blue: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
    orange: ['#ffedd5', '#fdba74', '#f97316', '#c2410c'],
    green: ['#dcfce7', '#86efac', '#22c55e', '#15803d'],
    pink: ['#fce7f3', '#f9a8d4', '#ec4899', '#be185d'],
    purple: ['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce'],
    amber: ['#fef3c7', '#fcd34d', '#f59e0b', '#b45309'],
    red: ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c'],
};

function makeColorFn(color: string) {
    const palette = COLOR_MAP[color] ?? COLOR_MAP['blue']!;
    return (value: number): string => {
        if (value === 0) return '#f4f4f5';
        if (value === 1) return palette[1]!;
        if (value <= 2) return palette[2]!;
        return palette[3]!;
    };
}

export function HeatmapView({
    entries,
    category,
    weeks = 16,
    customDefs,
}: HeatmapViewProps) {
    const color = getCategoryColor(category, customDefs);

    const heatmapData = useMemo(() => {
        const counts = new Map<string, number>();
        for (const e of entries) {
            counts.set(e.entryDate, (counts.get(e.entryDate) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([date, value]) => ({
            date,
            value,
        }));
    }, [entries]);

    const colorFn = useMemo(() => makeColorFn(color), [color]);

    if (entries.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No entries yet.
            </p>
        );
    }

    return (
        <div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
                Activity over last {weeks} weeks
            </p>
            <Heatmap data={heatmapData} weeks={weeks} colorFn={colorFn} />
        </div>
    );
}
