'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { MetricCard } from '../MetricCard';
import { MetricsEmptyState } from '../MetricsEmptyState';
import { AlertTriangle, ExternalLink } from 'lucide-react';

function parseMetricLine(text: string, name: string): number {
    const re = new RegExp(
        `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([\\d.]+)`,
        'm',
    );
    const m = text.match(re);
    return m?.[1] ? parseFloat(m[1]) : 0;
}

function SentryLink() {
    const org = process.env.NEXT_PUBLIC_SENTRY_ORG ?? '';
    const proj = process.env.NEXT_PUBLIC_SENTRY_PROJECT ?? '';
    if (!org || !proj) return null;
    return (
        <a
            href={`https://sentry.io/organizations/${org}/issues/?project=${proj}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
            <ExternalLink size={13} /> Open Sentry
        </a>
    );
}

export function MetricsErrorsPage() {
    const [metrics, setMetrics] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRouteFetch('/api/metrics')
            .then((r) => r.text())
            .then(setMetrics)
            .catch(() => {
                /* Prometheus optional */
            })
            .finally(() => setLoading(false));
    }, []);

    const httpErrors = parseMetricLine(
        metrics,
        'dashboard_http_requests_total{.*status="5',
    );
    const widgetErrors = parseMetricLine(
        metrics,
        'dashboard_widget_errors_total',
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Errors
                </h1>
                <SentryLink />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    label="HTTP 5xx (cumulative)"
                    value={loading ? '…' : Math.round(httpErrors)}
                    icon={AlertTriangle}
                    color="red"
                />
                <MetricCard
                    label="Widget Errors (cumul)"
                    value={loading ? '…' : Math.round(widgetErrors)}
                    icon={AlertTriangle}
                    color="yellow"
                />
            </div>
            {!loading && metrics === '' && (
                <MetricsEmptyState message="Prometheus metrics unavailable. Check /api/metrics endpoint." />
            )}
            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-4 text-sm text-orange-800 dark:text-orange-300">
                Sentry is integrated via{' '}
                <code className="font-mono text-xs">@sentry/nextjs</code>.
                Frontend and API errors are automatically captured. Set{' '}
                <code className="font-mono text-xs">
                    NEXT_PUBLIC_SENTRY_ORG
                </code>{' '}
                and{' '}
                <code className="font-mono text-xs">
                    NEXT_PUBLIC_SENTRY_PROJECT
                </code>{' '}
                for the direct link above.
            </div>
        </div>
    );
}
