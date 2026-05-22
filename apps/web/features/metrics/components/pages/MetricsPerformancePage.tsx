'use client';

import { MetricCard } from '../MetricCard';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { MetricsErrorState } from '../MetricsErrorState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchPerformanceMetrics } from '../../lib/metricsApi';
import type { DailySeries } from '../../types/metrics';
import { Gauge, Clock } from 'lucide-react';

interface PerfData {
    p50: number;
    p95: number;
    p99: number;
    series: DailySeries[];
}

export function MetricsPerformancePage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<PerfData>(
        () => fetchPerformanceMetrics(dateRange.from, dateRange.to),
        [dateRange.from, dateRange.to],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Performance
            </h1>
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    label="P50 Latency"
                    value={loading ? '…' : `${data?.p50 ?? 0}ms`}
                    icon={Gauge}
                    color="green"
                />
                <MetricCard
                    label="P95 Latency"
                    value={loading ? '…' : `${data?.p95 ?? 0}ms`}
                    icon={Clock}
                    color="yellow"
                />
                <MetricCard
                    label="P99 Latency"
                    value={loading ? '…' : `${data?.p99 ?? 0}ms`}
                    icon={Clock}
                    color="red"
                />
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                <TimeSeriesChart
                    data={data?.series ?? []}
                    title="Average Latency Over Time (ms)"
                />
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
                Instrument routes with{' '}
                <code className="font-mono text-xs">performance_events</code>{' '}
                inserts or integrate OpenTelemetry for richer trace data.
            </div>
        </div>
    );
}
