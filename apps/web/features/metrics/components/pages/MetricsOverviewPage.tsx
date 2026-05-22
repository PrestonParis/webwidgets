'use client';

import {
    Users,
    Puzzle,
    Zap,
    Brain,
    DollarSign,
    AlertTriangle,
} from 'lucide-react';
import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { MetricsErrorState } from '../MetricsErrorState';
import { MetricsEmptyState } from '../MetricsEmptyState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchOverview } from '../../lib/metricsApi';
import type { OverviewStats } from '../../types/metrics';

function StatGrid({ s }: { s: OverviewStats }) {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="DAU" value={s.dau} icon={Users} color="violet" />
            <MetricCard
                label="Widgets Added"
                value={s.widgetsAdded}
                icon={Puzzle}
                color="blue"
            />
            <MetricCard
                label="Actions Suggested"
                value={s.actionsSugg}
                icon={Zap}
                color="green"
            />
            <MetricCard
                label="ML Predictions"
                value={s.mlPredictions}
                icon={Brain}
                color="violet"
            />
            <MetricCard
                label="Actions Accepted"
                value={s.actionsAccepted}
                icon={Zap}
                color="green"
            />
            <MetricCard
                label="Actions Failed"
                value={s.actionsFailed}
                icon={AlertTriangle}
                color="red"
            />
            <MetricCard
                label="AI Cost"
                value={`$${s.aiCostUsd.toFixed(2)}`}
                icon={DollarSign}
                color="yellow"
            />
            <MetricCard
                label="Low-Conf ML %"
                value={`${s.mlLowConfRate}%`}
                icon={Brain}
                color="yellow"
            />
        </div>
    );
}

export function MetricsOverviewPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<OverviewStats>(
        () => fetchOverview(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Overview
            </h1>

            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : data ? (
                <StatGrid s={data} />
            ) : (
                <MetricsEmptyState />
            )}

            {data && (
                <div className="grid xl:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                        <TimeSeriesChart
                            data={data.series.dau ?? []}
                            title="Daily Active Users"
                        />
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                        <TimeSeriesChart
                            data={data.series.widgets ?? []}
                            title="Widgets Added"
                        />
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                        <TimeSeriesChart
                            data={data.series.actions ?? []}
                            title="Actions Executed"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
