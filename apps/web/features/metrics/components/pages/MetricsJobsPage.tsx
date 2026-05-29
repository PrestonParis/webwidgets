'use client';

import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { MetricCard } from '../MetricCard';
import { MetricsErrorState } from '../MetricsErrorState';
import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';

interface JobsData {
    jobs: Array<{ status: string; type: string }>;
}

function fetchJobsData(): Promise<JobsData> {
    return fetch('/api/jobs').then((r) => r.json() as Promise<JobsData>);
}

function countByStatus(jobs: JobsData['jobs'], status: string): number {
    return jobs.filter((j) => j.status === status).length;
}

export function MetricsJobsPage() {
    const { data, loading, error, refetch } = useMetricsFetch<JobsData>(
        fetchJobsData,
        [],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const jobs = data?.jobs ?? [];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Jobs
            </h1>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Jobs"
                    value={loading ? '…' : jobs.length}
                    icon={Server}
                    color="violet"
                />
                <MetricCard
                    label="Completed"
                    value={loading ? '…' : countByStatus(jobs, 'completed')}
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    label="Failed"
                    value={loading ? '…' : countByStatus(jobs, 'failed')}
                    icon={XCircle}
                    color="red"
                />
                <MetricCard
                    label="Pending"
                    value={loading ? '…' : countByStatus(jobs, 'pending')}
                    icon={Clock}
                    color="yellow"
                />
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
                Queue metrics (depth, throughput, dead-letter counts) require
                BullMQ instrumentation. Instrument workers to emit{' '}
                <code className="font-mono text-xs">analytics_events</code> or
                expose a Bull Board endpoint.
            </div>
        </div>
    );
}
