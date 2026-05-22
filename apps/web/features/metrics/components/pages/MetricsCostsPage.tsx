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
import { fetchCostMetrics } from '../../lib/metricsApi';
import type { CostSummary, DailySeries } from '../../types/metrics';
import { DollarSign } from 'lucide-react';

interface CostsData {
    summaries: CostSummary[];
    series: DailySeries[];
}

const COLUMNS: ColumnDef<CostSummary>[] = [
    {
        accessorKey: 'provider',
        header: 'Provider',
        cell: ({ getValue }) => (
            <code className="text-xs font-mono">{getValue<string>()}</code>
        ),
    },
    {
        accessorKey: 'feature',
        header: 'Feature',
        cell: ({ getValue }) => getValue<string>(),
    },
    {
        accessorKey: 'calls',
        header: 'Calls',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'totalUsd',
        header: 'Cost USD',
        cell: ({ getValue }) => `$${getValue<number>().toFixed(4)}`,
    },
];

export function MetricsCostsPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<CostsData>(
        () => fetchCostMetrics(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    const exportRows = useMemo(
        () => (data?.summaries ?? []) as unknown as Record<string, unknown>[],
        [data],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const totalCost = (data?.summaries ?? []).reduce(
        (s, r) => s + r.totalUsd,
        0,
    );
    const totalCalls = (data?.summaries ?? []).reduce((s, r) => s + r.calls, 0);

    const barData = (data?.summaries ?? []).slice(0, 10).map((s) => ({
        label: `${s.provider}/${s.feature}`,
        value: s.totalUsd,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Costs
                </h1>
                <ExportCsvButton rows={exportRows} filename="costs.csv" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    label="Total AI Cost"
                    value={loading ? '…' : `$${totalCost.toFixed(4)}`}
                    icon={DollarSign}
                    color="yellow"
                />
                <MetricCard
                    label="Total AI Calls"
                    value={loading ? '…' : totalCalls.toLocaleString()}
                    icon={DollarSign}
                    color="violet"
                />
            </div>
            <div className="grid xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <TimeSeriesChart
                        data={data?.series ?? []}
                        title="AI Activity Over Time"
                    />
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <BarMetricChart
                        data={barData}
                        title="Cost by Provider/Feature"
                        vertical
                        height={200}
                    />
                </div>
            </div>
            {!loading && (
                <MetricsDataTable<CostSummary>
                    columns={COLUMNS}
                    data={data?.summaries ?? []}
                />
            )}
        </div>
    );
}
