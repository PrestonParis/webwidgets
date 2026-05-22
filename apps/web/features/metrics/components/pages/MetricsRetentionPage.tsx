'use client';

import { MetricsEmptyState } from '../MetricsEmptyState';
import { RefreshCw } from 'lucide-react';

const PLACEHOLDER_COHORTS = [
    { cohort: 'May 2026', d1: 68, d7: 42, d30: 28 },
    { cohort: 'Apr 2026', d1: 72, d7: 45, d30: 31 },
    { cohort: 'Mar 2026', d1: 65, d7: 39, d30: 24 },
];

function RetentionRow({
    cohort,
    d1,
    d7,
    d30,
}: {
    cohort: string;
    d1: number;
    d7: number;
    d30: number;
}) {
    const bar = (pct: number) => (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                <div
                    className="h-full rounded bg-violet-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs w-8 text-right text-gray-600 dark:text-zinc-400">
                {pct}%
            </span>
        </div>
    );

    return (
        <tr className="border-b border-gray-100 dark:border-zinc-800">
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-zinc-300">
                {cohort}
            </td>
            <td className="px-4 py-3 w-40">{bar(d1)}</td>
            <td className="px-4 py-3 w-40">{bar(d7)}</td>
            <td className="px-4 py-3 w-40">{bar(d30)}</td>
        </tr>
    );
}

export function MetricsRetentionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-violet-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Retention
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                Cohort
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                D1
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                D7
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                D30
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {PLACEHOLDER_COHORTS.map((c) => (
                            <RetentionRow key={c.cohort} {...c} />
                        ))}
                    </tbody>
                </table>
            </div>

            <MetricsEmptyState message="Live cohort data requires a dedicated retention query. Placeholder cohorts shown above." />
        </div>
    );
}
