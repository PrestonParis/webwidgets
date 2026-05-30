'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '@/features/ui/visualizations/components/TimeSeriesChart';
import { MetricsDataTable } from '../MetricsDataTable';
import { ExportCsvButton } from '../ExportCsvButton';
import { MetricsErrorState } from '../MetricsErrorState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchWidgetMetrics } from '../../lib/metricsApi';
import type { WidgetMetricRow, DailySeries } from '../../types/metrics';
import { Puzzle, EyeOff, Trash2 } from 'lucide-react';

interface WidgetsData {
    rows: WidgetMetricRow[];
    series: DailySeries[];
}

const COLUMNS: ColumnDef<WidgetMetricRow>[] = [
    {
        accessorKey: 'widgetType',
        header: 'Widget',
        cell: ({ getValue }) => (
            <code className="text-xs font-mono">{getValue<string>()}</code>
        ),
    },
    {
        accessorKey: 'usageCount',
        header: 'Opens',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'addCount',
        header: 'Added',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'hideCount',
        header: 'Hidden',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'removeCount',
        header: 'Removed',
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
    },
    {
        accessorKey: 'retentionRate',
        header: 'Retention %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
    {
        accessorKey: 'avgRenderMs',
        header: 'Avg Render ms',
        cell: ({ getValue }) => `${getValue<number>()}ms`,
    },
    {
        accessorKey: 'errorRate',
        header: 'Error %',
        cell: ({ getValue }) => `${getValue<number>()}%`,
    },
];

export function MetricsWidgetsPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<WidgetsData>(
        () => fetchWidgetMetrics(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    const exportRows = useMemo(
        () => (data?.rows ?? []) as unknown as Record<string, unknown>[],
        [data],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const rows = data?.rows ?? [];
    const totalAdded = rows.reduce((s, r) => s + r.addCount, 0);
    const totalHidden = rows.reduce((s, r) => s + r.hideCount, 0);
    const totalRemoved = rows.reduce((s, r) => s + r.removeCount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Widgets
                </h1>
                <ExportCsvButton
                    rows={exportRows}
                    filename="widgets-metrics.csv"
                />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <MetricCard
                    label="Widgets Added"
                    value={loading ? '…' : totalAdded}
                    icon={Puzzle}
                    color="violet"
                />
                <MetricCard
                    label="Widgets Hidden"
                    value={loading ? '…' : totalHidden}
                    icon={EyeOff}
                    color="yellow"
                />
                <MetricCard
                    label="Widgets Removed"
                    value={loading ? '…' : totalRemoved}
                    icon={Trash2}
                    color="red"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                <TimeSeriesChart
                    data={data?.series ?? []}
                    title="Widget Additions Over Time"
                />
            </div>

            {!loading && (
                <MetricsDataTable<WidgetMetricRow>
                    columns={COLUMNS}
                    data={rows}
                />
            )}
        </div>
    );
}
