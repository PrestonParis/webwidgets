'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useMetricsFilter } from '../hooks/useMetricsFilter';

const PRESETS = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: '1y', days: 365 },
];

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export function MetricsDateRangePicker() {
    const { dateRange, setDateRange } = useMetricsFilter();
    const [open, setOpen] = useState(false);

    const handlePreset = (days: number) => {
        setDateRange(daysAgo(days), new Date().toISOString().slice(0, 10));
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
                <Calendar size={13} />
                <span>
                    {dateRange.from} → {dateRange.to}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 w-72">
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-2">
                        Quick presets
                    </p>
                    <div className="flex gap-1 mb-3">
                        {PRESETS.map(({ label, days }) => (
                            <button
                                key={label}
                                onClick={() => handlePreset(days)}
                                className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1.5">
                        Custom range
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) =>
                                setDateRange(e.target.value, dateRange.to)
                            }
                            className="flex-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <span className="text-xs text-gray-400">→</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) =>
                                setDateRange(dateRange.from, e.target.value)
                            }
                            className="flex-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="mt-2 w-full text-xs py-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
