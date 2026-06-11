'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrackingInsightsPanelProps } from '@/types/tracking';

interface TrendResult {
    metric: string;
    trend_direction: string;
    trend_strength: number;
    significant: boolean;
}

export function TrackingInsightsPanel({ logs }: TrackingInsightsPanelProps) {
    const [trends, setTrends] = useState<TrendResult[]>([]);

    useEffect(() => {
        if (!logs.length) return;

        const byMetric = new Map<string, number[]>();
        for (const log of logs) {
            const arr = byMetric.get(log.metric) ?? [];
            arr.push(log.value);
            byMetric.set(log.metric, arr);
        }

        const metrics = [...byMetric.entries()].filter(
            ([, vals]) => vals.length >= 3,
        );
        if (!metrics.length) return;

        void Promise.all(
            metrics.map(async ([metric, values]) => {
                try {
                    const res = await apiRouteFetch('/api/ml/analyze-trends', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ metric, values }),
                        signal: AbortSignal.timeout(5000),
                    });
                    if (!res.ok) return null;
                    return (await res.json()) as TrendResult;
                } catch {
                    return null;
                }
            }),
        ).then((results) => {
            setTrends(
                results.filter(
                    (r): r is TrendResult => r !== null && r.significant,
                ),
            );
        });
    }, [logs]);

    if (!trends.length) return null;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
                ML Trend Insights
            </p>
            <div className="space-y-1.5">
                {trends.map((t) => (
                    <div
                        key={t.metric}
                        className="flex items-center gap-2 text-sm"
                    >
                        {t.trend_direction === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : t.trend_direction === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                        ) : (
                            <Minus className="h-4 w-4 text-zinc-400" />
                        )}
                        <span className="capitalize text-zinc-300">
                            {t.metric.replace(/_/g, ' ')}
                        </span>
                        <span className="text-zinc-500">
                            trending {t.trend_direction} (
                            {Math.round(t.trend_strength * 100)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
