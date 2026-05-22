'use client';

import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchOverview } from '../../lib/metricsApi';
import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { MetricsErrorState } from '../MetricsErrorState';
import type { OverviewStats } from '../../types/metrics';
import { Users, Puzzle, Zap } from 'lucide-react';

export function MetricsProductPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<OverviewStats>(
        () => fetchOverview(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Product
            </h1>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <MetricCard
                    label="DAU"
                    value={loading ? '…' : (data?.dau ?? 0)}
                    icon={Users}
                    color="violet"
                />
                <MetricCard
                    label="Widgets Opened"
                    value={loading ? '…' : (data?.widgetsOpened ?? 0)}
                    icon={Puzzle}
                    color="blue"
                />
                <MetricCard
                    label="Actions Executed"
                    value={loading ? '…' : (data?.actionsAccepted ?? 0)}
                    icon={Zap}
                    color="green"
                />
            </div>

            <div className="grid xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <TimeSeriesChart
                        data={data?.series?.dau ?? []}
                        title="Daily Active Users"
                    />
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <TimeSeriesChart
                        data={data?.series?.widgets ?? []}
                        title="Widget Adoptions"
                    />
                </div>
            </div>

            <div className="rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 p-4 text-sm text-violet-800 dark:text-violet-300">
                Onboarding funnel analytics require{' '}
                <code className="font-mono text-xs">onboarding_started</code>{' '}
                and{' '}
                <code className="font-mono text-xs">onboarding_completed</code>{' '}
                events. Wire{' '}
                <code className="font-mono text-xs">trackEvent()</code> in your
                onboarding flow to populate this page.
            </div>
        </div>
    );
}
