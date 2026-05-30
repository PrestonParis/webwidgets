'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { MetricsEmptyState } from '@/features/metrics/components/MetricsEmptyState';

interface BarDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface BarMetricChartProps {
    data: BarDataPoint[];
    title?: string;
    height?: number;
    color?: string;
    vertical?: boolean;
}

const DEFAULT_COLORS = [
    '#7c3aed',
    '#2563eb',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#9333ea',
];

export function BarMetricChart({
    data,
    title,
    height = 220,
    color,
    vertical = false,
}: BarMetricChartProps) {
    if (data.length === 0)
        return <MetricsEmptyState message="No data for selected range" />;

    const margin = vertical
        ? { top: 4, right: 8, left: 80, bottom: 0 }
        : { top: 4, right: 8, left: -24, bottom: 0 };

    return (
        <div>
            {title && (
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2">
                    {title}
                </p>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    layout={vertical ? 'vertical' : 'horizontal'}
                    margin={margin}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-gray-100 dark:text-zinc-800"
                    />
                    {vertical ? (
                        <>
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis
                                type="category"
                                dataKey="label"
                                tick={{ fontSize: 10 }}
                                width={78}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                        </>
                    )}
                    <Tooltip />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {data.map((entry, i) => (
                            <Cell
                                key={entry.label}
                                fill={
                                    entry.color ??
                                    color ??
                                    DEFAULT_COLORS[i % DEFAULT_COLORS.length] ??
                                    '#7c3aed'
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
