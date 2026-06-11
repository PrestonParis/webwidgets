'use client';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { MetricsEmptyState } from '@/features/metrics/components/MetricsEmptyState';

interface PieDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface PieMetricChartProps {
    data: PieDataPoint[];
    title?: string;
    height?: number;
}

interface PieLabelProps {
    label?: unknown;
    percent?: unknown;
}

const DEFAULT_COLORS = [
    '#7c3aed',
    '#2563eb',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#9333ea',
    '#f43f5e',
];

export function PieMetricChart({
    data,
    title,
    height = 220,
}: PieMetricChartProps) {
    if (data.length === 0)
        return <MetricsEmptyState message="No data for selected range" />;

    return (
        <div>
            {title && (
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2">
                    {title}
                </p>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={height / 2 - 30}
                        label={({ label, percent }: PieLabelProps) => {
                            const name = typeof label === 'string' ? label : '';
                            const ratio =
                                typeof percent === 'number' ? percent : 0;
                            return `${name} ${(ratio * 100).toFixed(0)}%`;
                        }}
                        labelLine={false}
                    >
                        {data.map((entry, i) => (
                            <Cell
                                key={entry.label}
                                fill={
                                    entry.color ??
                                    DEFAULT_COLORS[i % DEFAULT_COLORS.length] ??
                                    '#7c3aed'
                                }
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(v) => (v as number).toLocaleString()}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
