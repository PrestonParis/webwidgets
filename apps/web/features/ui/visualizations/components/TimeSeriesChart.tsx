'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { DailySeries } from '@/features/metrics/types/metrics';
import { MetricsEmptyState } from '@/features/metrics/components/MetricsEmptyState';

interface Series {
    key: string;
    label: string;
    color: string;
}

interface TimeSeriesChartProps {
    data: DailySeries[] | Record<string, DailySeries[]>;
    series?: Series[];
    title?: string;
    height?: number;
}

type ChartRow = { date: string } & Record<string, unknown>;

const DEFAULT_COLOR = '#7c3aed';

function formatDate(d: string): string {
    const [, m, day] = d.split('-');
    return `${m}/${day}`;
}

function normaliseSingle(data: DailySeries[]): ChartRow[] {
    return data.map(({ date, value }) => ({ date, value }));
}

function normaliseMulti(data: Record<string, DailySeries[]>): ChartRow[] {
    const dateMap = new Map<string, ChartRow>();
    for (const [key, rows] of Object.entries(data)) {
        for (const { date, value } of rows) {
            const entry = dateMap.get(date) ?? { date };
            entry[key] = value;
            dateMap.set(date, entry);
        }
    }
    return Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}

function formatTooltipLabel(label: unknown): string {
    return typeof label === 'string' ? formatDate(label) : '';
}

export function TimeSeriesChart({
    data,
    series,
    title,
    height = 220,
}: TimeSeriesChartProps) {
    const isMulti = !Array.isArray(data);
    const chartData = isMulti ? normaliseMulti(data) : normaliseSingle(data);

    if (chartData.length === 0)
        return <MetricsEmptyState message="No data for selected range" />;

    const lines: Series[] =
        series ??
        (isMulti
            ? Object.keys(data).map((k, i) => ({
                  key: k,
                  label: k,
                  color:
                      ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626'][
                          i % 5
                      ] ?? DEFAULT_COLOR,
              }))
            : [
                  {
                      key: 'value',
                      label: title ?? 'Value',
                      color: DEFAULT_COLOR,
                  },
              ]);

    return (
        <div>
            {title && (
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2">
                    {title}
                </p>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={chartData}
                    margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-gray-100 dark:text-zinc-800"
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip labelFormatter={formatTooltipLabel} />
                    {lines.length > 1 && (
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    )}
                    {lines.map(({ key, label, color }) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={label}
                            stroke={color}
                            dot={false}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
