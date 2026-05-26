'use client';

import { useCallback, useMemo } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type {
    BiometricDataPoint,
    BiometricWindow,
} from '@/features/tracking/lib/health/types';

const HRV_COLOR = '#6366f1'; // indigo
const RHR_COLOR = '#f43f5e'; // rose

const WINDOWS: BiometricWindow[] = ['7d', '30d', '90d'];

interface BiometricChartProps {
    data: BiometricDataPoint[];
    window: BiometricWindow;
    onWindowChange: (w: BiometricWindow) => void;
    height?: number;
}

function formatDate(value: string): string {
    const [, month, day] = value.split('-');
    return month && day ? `${month}/${day}` : value;
}

export default function BiometricChart({
    data,
    window,
    onWindowChange,
    height = 220,
}: BiometricChartProps) {
    const chartData = useMemo(
        () =>
            data.map((point) => ({
                date: point.date,
                hrv: point.hrv ?? null,
                rhr: point.rhr ?? null,
            })),
        [data],
    );

    const handleWindow = useCallback(
        (next: BiometricWindow) => onWindowChange(next),
        [onWindowChange],
    );

    const hasData = chartData.some(
        (point) => point.hrv !== null || point.rhr !== null,
    );

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-end">
                <div
                    className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800"
                    role="tablist"
                    aria-label="Biometric window"
                >
                    {WINDOWS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="tab"
                            aria-selected={window === option}
                            onClick={() => handleWindow(option)}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                window === option
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                                    : 'text-gray-500 dark:text-zinc-400'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {!hasData ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center dark:border-zinc-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                        No biometric data yet.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        Connect a wearable in Settings.
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
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
                        <YAxis
                            yAxisId="hrv"
                            tick={{ fontSize: 10 }}
                            label={{
                                value: 'HRV (ms)',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: 9, fill: HRV_COLOR },
                            }}
                        />
                        <YAxis
                            yAxisId="rhr"
                            orientation="right"
                            tick={{ fontSize: 10 }}
                            label={{
                                value: 'RHR (bpm)',
                                angle: 90,
                                position: 'insideRight',
                                style: { fontSize: 9, fill: RHR_COLOR },
                            }}
                        />
                        <Tooltip
                            labelFormatter={(label) =>
                                formatDate(String(label))
                            }
                            formatter={(
                                value: number | string,
                                name: string,
                            ) => [value, name]}
                        />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        <Line
                            yAxisId="hrv"
                            type="monotone"
                            dataKey="hrv"
                            name="HRV"
                            stroke={HRV_COLOR}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                        <Line
                            yAxisId="rhr"
                            type="monotone"
                            dataKey="rhr"
                            name="RHR"
                            stroke={RHR_COLOR}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
