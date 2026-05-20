'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { BarMetricChart } from '../BarMetricChart';
import { MetricsDataTable } from '../MetricsDataTable';
import { ExportCsvButton } from '../ExportCsvButton';
import { MetricsErrorState } from '../MetricsErrorState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchActionMetrics } from '../../lib/metricsApi';
import type { ActionMetricRow, DailySeries } from '../../types/metrics';
import { Zap, CheckCircle, XCircle } from 'lucide-react';

interface ActionsData {
    rows: ActionMetricRow[];
    series: DailySeries[];
}

const COLUMNS: ColumnDef<ActionMetricRow>[] = [
    {
        accessorKey: 'type',
        header: 'Action Type',
        cell: ({ getValue }) => (
            <code className="text-xs font-mono">{getValue<string>()}</code>
        ),
    },
    {
        accessorKey: 'suggested',
        header: 'Suggested',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'accepted',
        header: 'Accepted',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'rejected',
        header: 'Rejected',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'executed',
        header: 'Executed',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'failed',
        header: 'Failed',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'acceptanceRate',
        header: 'Accept %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
    {
        accessorKey: 'failureRate',
        header: 'Fail %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
];

export function MetricsActionsPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<ActionsData>(
        () => fetchActionMetrics(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    const exportRows = useMemo(
        () => (data?.rows ?? []) as unknown as Record<string, unknown>[],
        [data],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const row = data?.rows[0];

    const barData = row
        ? [
              { label: 'Suggested', value: row.suggested },
              { label: 'Accepted', value: row.accepted },
              { label: 'Executed', value: row.executed },
              { label: 'Failed', value: row.failed, color: '#dc2626' },
          ]
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Actions
                </h1>
                <ExportCsvButton
                    rows={exportRows}
                    filename="actions-metrics.csv"
                />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    label="Suggested"
                    value={loading ? '…' : (row?.suggested ?? 0)}
                    icon={Zap}
                    color="violet"
                />
                <MetricCard
                    label="Accepted"
                    value={loading ? '…' : (row?.accepted ?? 0)}
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    label="Failed"
                    value={loading ? '…' : (row?.failed ?? 0)}
                    icon={XCircle}
                    color="red"
                />
                <MetricCard
                    label="Acceptance %"
                    value={loading ? '…' : `${row?.acceptanceRate ?? 0}%`}
                    icon={Zap}
                    color="blue"
                />
            </div>

            <div className="grid xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <TimeSeriesChart
                        data={data?.series ?? []}
                        title="Actions Executed Over Time"
                    />
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <BarMetricChart
                        data={barData}
                        title="Action Volume Breakdown"
                    />
                </div>
            </div>

            {!loading && (
                <MetricsDataTable<ActionMetricRow>
                    columns={COLUMNS}
                    data={data?.rows ?? []}
                />
            )}
        </div>
    );
}
