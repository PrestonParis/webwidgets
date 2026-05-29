'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { AnomalyAlertBannerProps } from '@/features/finance/types/finance';

interface AnomalyResult {
    id: string;
    anomaly_score: number;
    is_anomaly: boolean;
}

export function AnomalyAlertBanner({ transactions }: AnomalyAlertBannerProps) {
    const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!transactions.length) return;
        const recent = transactions.slice(0, 50);
        fetch('/api/ml/detect-finance-anomalies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactions: recent.map((t) => ({
                    id: t.id,
                    merchant: t.merchant ?? t.title,
                    category: t.category,
                    amount: Math.abs(t.amount),
                })),
            }),
            signal: AbortSignal.timeout(5000),
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data: { anomalies?: AnomalyResult[] } | null) => {
                if (data?.anomalies) {
                    setAnomalies(data.anomalies.filter((a) => a.is_anomaly));
                }
            })
            .catch(() => {});
    }, [transactions]);

    if (!anomalies.length || dismissed) return null;

    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="flex-1">
                <span className="font-medium text-amber-300">
                    {anomalies.length} unusual transaction
                    {anomalies.length > 1 ? 's' : ''} detected
                </span>
                <span className="ml-1 text-amber-300/70">
                    — review your recent activity
                </span>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="text-amber-400/60 hover:text-amber-400"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
