'use client';

import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminMetricCard } from '../AdminMetricCard';
import { Brain, Zap, Clock } from 'lucide-react';

interface PrometheusLine {
    name: string;
    value: number;
    labels: Record<string, string>;
}

function parseLines(text: string): PrometheusLine[] {
    return text
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
            const m = l.match(/^(\S+)(?:\{([^}]*)\})?\s+([\d.eE+\-]+)/);
            if (!m) return null;
            const name = m[1];
            const valueStr = m[3];
            if (!name || !valueStr) return null;
            const labels: Record<string, string> = {};
            const labelStr = m[2];
            if (labelStr) {
                for (const p of labelStr.split(',')) {
                    const [k, v] = p.split('=');
                    if (k && v) labels[k.trim()] = v.replace(/"/g, '').trim();
                }
            }
            return { name, value: parseFloat(valueStr), labels };
        })
        .filter((x): x is PrometheusLine => x !== null);
}

export function AdminMLPage() {
    const [lines, setLines] = useState<PrometheusLine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/metrics')
            .then((r) => r.text())
            .then((t) => setLines(parseLines(t)))
            .catch(() => {
                /* metrics unavailable */
            })
            .finally(() => setLoading(false));
    }, []);

    const mlLines = lines.filter((l) => l.name.startsWith('dashboard_ml_'));
    const totalInf = mlLines
        .filter((l) => l.name === 'dashboard_ml_inference_total')
        .reduce((s, l) => s + l.value, 0);
    const byStage = Object.fromEntries(
        mlLines
            .filter((l) => l.name === 'dashboard_ml_inference_total')
            .map((l) => [l.labels.stage ?? 'unknown', l.value]),
    );

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="ML"
                description="Model inference telemetry and performance"
            />

            <div className="grid grid-cols-3 gap-4">
                <AdminMetricCard
                    label="Total Inferences"
                    value={loading ? '…' : Math.round(totalInf)}
                    icon={Brain}
                    color="purple"
                />
                <AdminMetricCard
                    label="Stages Active"
                    value={loading ? '…' : Object.keys(byStage).length}
                    icon={Zap}
                    color="indigo"
                />
                <AdminMetricCard
                    label="Avg Latency"
                    value="—"
                    sub="latency histogram not yet aggregated"
                    icon={Clock}
                    color="blue"
                />
            </div>

            {Object.keys(byStage).length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                        Inferences by Stage
                    </h2>
                    <div className="space-y-2">
                        {Object.entries(byStage).map(([stage, count]) => (
                            <div
                                key={stage}
                                className="flex items-center justify-between text-sm"
                            >
                                <code className="text-xs font-mono text-gray-700 dark:text-zinc-300">
                                    {stage}
                                </code>
                                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && mlLines.length === 0 && (
                <div className="text-sm text-gray-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                    No ML metrics found. Instrument your inference calls with{' '}
                    <code className="font-mono">mlInferenceTotal</code> from{' '}
                    <code className="font-mono">lib/observability/metrics</code>
                    .
                </div>
            )}
        </div>
    );
}
