'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminMetricCard } from '../AdminMetricCard';
import { BarChart2, Clock, Zap, AlertTriangle } from 'lucide-react';

interface PrometheusMetric {
    name: string;
    value: number;
    labels: Record<string, string>;
}

function parsePrometheus(text: string): PrometheusMetric[] {
    const metrics: PrometheusMetric[] = [];
    for (const line of text.split('\n')) {
        if (line.startsWith('#') || !line.trim()) continue;
        const match = line.match(/^(\S+)(?:\{([^}]*)\})?\s+([\d.eE+\-]+)/);
        if (!match) continue;
        const name = match[1];
        const labelStr = match[2];
        const valueStr = match[3];
        if (!name || !valueStr) continue;
        const labels: Record<string, string> = {};
        if (labelStr) {
            for (const pair of labelStr.split(',')) {
                const [k, v] = pair.split('=');
                if (k && v) labels[k.trim()] = v.replace(/"/g, '').trim();
            }
        }
        metrics.push({ name, value: parseFloat(valueStr), labels });
    }
    return metrics;
}

function sumMetric(metrics: PrometheusMetric[], name: string): number {
    return metrics
        .filter((m) => m.name === name)
        .reduce((s, m) => s + m.value, 0);
}

export function AdminMetricsPage() {
    const [raw, setRaw] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRouteFetch('/api/metrics')
            .then((r) => r.text())
            .then(setRaw)
            .catch(() => setRaw(''))
            .finally(() => setLoading(false));
    }, []);

    const metrics = raw ? parsePrometheus(raw) : [];
    const totalReqs = sumMetric(metrics, 'dashboard_http_requests_total');
    const totalErrors = metrics
        .filter(
            (m) =>
                m.name === 'dashboard_http_requests_total' &&
                m.labels.status?.startsWith('5'),
        )
        .reduce((s, m) => s + m.value, 0);
    const emailDepth = sumMetric(metrics, 'dashboard_email_queue_depth');
    const mlInference = sumMetric(metrics, 'dashboard_ml_inference_total');

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Metrics"
                description="Live Prometheus metrics from the running process"
            />

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminMetricCard
                    label="HTTP Requests"
                    value={loading ? '…' : Math.round(totalReqs)}
                    icon={BarChart2}
                    color="indigo"
                />
                <AdminMetricCard
                    label="5xx Errors"
                    value={loading ? '…' : Math.round(totalErrors)}
                    icon={AlertTriangle}
                    color="red"
                />
                <AdminMetricCard
                    label="Email Queue Depth"
                    value={loading ? '…' : Math.round(emailDepth)}
                    icon={Clock}
                    color="yellow"
                />
                <AdminMetricCard
                    label="ML Inferences"
                    value={loading ? '…' : Math.round(mlInference)}
                    icon={Zap}
                    color="purple"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                    Raw Prometheus Output
                </h2>
                <pre className="text-[11px] font-mono text-gray-600 dark:text-zinc-400 overflow-x-auto max-h-96 whitespace-pre-wrap">
                    {loading
                        ? 'Loading…'
                        : raw ||
                          'No metrics available. Check METRICS_SECRET env var if protected.'}
                </pre>
            </div>
        </div>
    );
}
