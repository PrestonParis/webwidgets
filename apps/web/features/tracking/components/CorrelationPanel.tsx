'use client';

import { useMemo } from 'react';
import { useInsightConsent } from '@/features/tracking/hooks/useInsightConsent';
import { findCorrelations } from '@/features/tracking/lib/correlationEngine';
import { getCategoryLabel } from '@/features/tracking/constants';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

interface CorrelationPanelProps {
    entries: TrackingEntry[];
}

function CorrelationBar({ coefficient }: { coefficient: number }) {
    const pct = Math.round(Math.abs(coefficient) * 100);
    const color =
        coefficient > 0
            ? 'bg-green-400 dark:bg-green-500'
            : 'bg-red-400 dark:bg-red-500';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 w-12 text-right">
                {coefficient > 0 ? '+' : ''}
                {coefficient.toFixed(2)}
            </span>
        </div>
    );
}

export function CorrelationPanel({ entries }: CorrelationPanelProps) {
    const { consent, updateConsent } = useInsightConsent();

    const correlations = useMemo(
        () =>
            consent.crossCategoryCorrelations
                ? findCorrelations(entries, consent)
                : [],
        [entries, consent],
    );

    if (!consent.crossCategoryCorrelations) {
        return (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-3xl">🔗</span>
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                        Cross-category correlations
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-xs">
                        Discover how sleep, mood, workouts, and other metrics
                        relate to each other.
                    </p>
                </div>
                <button
                    onClick={() =>
                        updateConsent({ crossCategoryCorrelations: true })
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                    Enable correlations
                </button>
            </div>
        );
    }

    if (correlations.length === 0) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-8">
                Not enough overlapping data yet — keep logging multiple
                categories.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Correlations
            </p>
            {correlations.map((c) => (
                <div
                    key={`${c.categoryA}-${c.metricA}-${c.categoryB}-${c.metricB}`}
                    className="space-y-1"
                >
                    <p className="text-xs text-gray-700 dark:text-zinc-300">
                        {getCategoryLabel(c.categoryA)}{' '}
                        <span className="text-gray-400">({c.metricA})</span>
                        {' ↔ '}
                        {getCategoryLabel(c.categoryB)}{' '}
                        <span className="text-gray-400">({c.metricB})</span>
                    </p>
                    <CorrelationBar coefficient={c.coefficient} />
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        n={c.sampleSize} · significance: {c.significance}
                    </p>
                </div>
            ))}
        </div>
    );
}
