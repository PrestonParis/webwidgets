'use client';

import { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface MiniHistoryChartProps {
    dates: string[];
    accentColor: string;
    defaultDays?: number;
}

interface ChartEntry {
    date: string;
    count: number;
    label: string;
    isToday: boolean;
}

const RANGE_OPTIONS = [
    { label: '7d', days: 7 },
    { label: '14d', days: 14 },
    { label: '30d', days: 30 },
];

const FILL_MAP: Record<string, { normal: string; today: string }> = {
    blue: { normal: '#3b82f640', today: '#3b82f6' },
    green: { normal: '#22c55e40', today: '#22c55e' },
    orange: { normal: '#f9731640', today: '#f97316' },
    pink: { normal: '#ec489940', today: '#ec4899' },
    purple: { normal: '#a855f740', today: '#a855f7' },
    violet: { normal: '#8b5cf640', today: '#8b5cf6' },
    indigo: { normal: '#6366f140', today: '#6366f1' },
    rose: { normal: '#f43f5e40', today: '#f43f5e' },
};
const DEFAULT_COLORS = { normal: '#6366f140', today: '#6366f1' };

export function MiniHistoryChart({
    dates,
    accentColor,
    defaultDays = 14,
}: MiniHistoryChartProps) {
    const [days, setDays] = useState(defaultDays);
    const today = new Date().toISOString().slice(0, 10);

    const data = useMemo((): ChartEntry[] => {
        const buckets: Record<string, number> = {};
        const end = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(d.getDate() - i);
            buckets[d.toISOString().slice(0, 10)] = 0;
        }
        for (const d of dates) {
            const key = d.slice(0, 10);
            if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1;
        }
        return Object.entries(buckets).map(([date, count]) => ({
            date,
            count,
            label: new Date(date + 'T12:00:00').toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
            }),
            isToday: date === today,
        }));
    }, [dates, days, today]);

    const colors = FILL_MAP[accentColor] ?? DEFAULT_COLORS;
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="space-y-1.5">
            {/* Range toggle */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {data.filter((d) => d.count > 0).length} of {days} days
                    logged
                </p>
                <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.days}
                            onClick={() => setDays(opt.days)}
                            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                days === opt.days
                                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-20 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={data}
                        margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
                        barSize={days <= 7 ? 20 : days <= 14 ? 12 : 6}
                    >
                        <XAxis
                            dataKey="label"
                            tick={false}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide domain={[0, maxCount]} />
                        <Tooltip
                            cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                            contentStyle={{
                                background: 'var(--color-zinc-900, #18181b)',
                                border: '1px solid var(--color-zinc-700, #3f3f46)',
                                borderRadius: 6,
                                fontSize: 11,
                                padding: '4px 8px',
                                color: '#e4e4e7',
                            }}
                            formatter={(
                                _v: unknown,
                                _n: unknown,
                                props: { payload?: ChartEntry },
                            ) => [
                                `${props.payload?.count ?? 0} entr${(props.payload?.count ?? 0) === 1 ? 'y' : 'ies'}`,
                                props.payload?.date ?? '',
                            ]}
                            labelFormatter={() => ''}
                        />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        entry.isToday
                                            ? colors.today
                                            : entry.count > 0
                                              ? colors.normal
                                              : 'rgba(128,128,128,0.12)'
                                    }
                                    stroke={
                                        entry.isToday ? colors.today : 'none'
                                    }
                                    strokeWidth={entry.isToday ? 1 : 0}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Today marker label */}
            <p
                className="text-[10px] text-right"
                style={{ color: colors.today }}
            >
                Today highlighted
            </p>
        </div>
    );
}
