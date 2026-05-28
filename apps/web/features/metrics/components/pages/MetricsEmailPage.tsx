'use client';

import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchEvents } from '../../lib/metricsApi';
import { MetricCard } from '../MetricCard';
import { MetricsErrorState } from '../MetricsErrorState';
import { MetricsEmptyState } from '../MetricsEmptyState';
import type { AnalyticsEventRow } from '../../types/metrics';
import { ANALYTICS_EVENTS } from '@/features/analytics/lib/eventNames';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

interface EmailData {
    events: AnalyticsEventRow[];
    total: number;
}

function countByType(events: AnalyticsEventRow[], type: string): number {
    return events.filter((e) => e.type === type).length;
}

export function MetricsEmailPage() {
    const { dateRange } = useMetricsFilter();
    const { data, loading, error, refetch } = useMetricsFetch<EmailData>(
        () => fetchEvents(dateRange.from, dateRange.to, { limit: 200 }),
        [dateRange.from, dateRange.to],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    const events = data?.events ?? [];
    const classified = countByType(events, ANALYTICS_EVENTS.EMAIL_CLASSIFIED);
    const extracted = countByType(
        events,
        ANALYTICS_EVENTS.EMAIL_ACTION_EXTRACTED,
    );
    const failed = countByType(
        events,
        ANALYTICS_EVENTS.EMAIL_PROCESSING_FAILED,
    );

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Email
            </h1>
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    label="Classified"
                    value={loading ? '…' : classified}
                    icon={Mail}
                    color="violet"
                />
                <MetricCard
                    label="Actions Extracted"
                    value={loading ? '…' : extracted}
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    label="Failed"
                    value={loading ? '…' : failed}
                    icon={XCircle}
                    color="red"
                />
            </div>
            {!loading && events.length === 0 && (
                <MetricsEmptyState message="No email events yet. Wire trackEvent() in the email processing pipeline." />
            )}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                Email bodies are never exposed here. Only event metadata
                (classification labels, action types) is recorded.
            </div>
        </div>
    );
}
