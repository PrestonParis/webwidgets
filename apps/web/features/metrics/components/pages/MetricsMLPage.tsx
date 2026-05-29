'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { MetricsDataTable } from '../MetricsDataTable';
import { ExportCsvButton } from '../ExportCsvButton';
import { MetricsErrorState } from '../MetricsErrorState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchMLMetrics } from '../../lib/metricsApi';
import type { MLMetricRow, DailySeries } from '../../types/metrics';
import { Brain, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

interface MLData {
    rows: MLMetricRow[];
    series: DailySeries[];
}

const COLUMNS: ColumnDef<MLMetricRow>[] = [
    {
        accessorKey: 'task',
        header: 'Task',
        cell: ({ getValue }) => (
            <code className="text-xs font-mono">{getValue<string>()}</code>
        ),
    },
    {
        accessorKey: 'predictions',
        header: 'Predictions',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'lowConfRate',
        header: 'Low-Conf %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
    {
        accessorKey: 'fallbackRate',
        header: 'Fallback %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
    {
        accessorKey: 'correctionRate',
        header: 'Correction %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
    {
        accessorKey: 'avgLatencyMs',
        header: 'Avg Latency ms',
        cell: ({ getValue }) => `${getValue<number>()}ms`,
    },
];

export function MetricsMLPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<MLData>(
        () => fetchMLMetrics(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    const exportRows = useMemo(
        () => (data?.rows ?? []) as unknown as Record<string, unknown>[],
        [data],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const row = data?.rows[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    ML Predictions
                </h1>
                <ExportCsvButton rows={exportRows} filename="ml-metrics.csv" />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Predictions"
                    value={loading ? '…' : (row?.predictions ?? 0)}
                    icon={Brain}
                    color="violet"
                />
                <MetricCard
                    label="Low-Confidence %"
                    value={loading ? '…' : `${row?.lowConfRate ?? 0}%`}
                    icon={AlertTriangle}
                    color="yellow"
                />
                <MetricCard
                    label="Fallback Rate %"
                    value={loading ? '…' : `${row?.fallbackRate ?? 0}%`}
                    icon={RefreshCw}
                    color="red"
                />
                <MetricCard
                    label="Avg Latency"
                    value={loading ? '…' : `${row?.avgLatencyMs ?? 0}ms`}
                    icon={Clock}
                    color="blue"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                <TimeSeriesChart
                    data={data?.series ?? []}
                    title="Predictions Over Time"
                />
            </div>

            {!loading && (
                <MetricsDataTable<MLMetricRow>
                    columns={COLUMNS}
                    data={data?.rows ?? []}
                />
            )}
        </div>
    );
}
