'use client';

import type {
    DateRange,
    DateRangePreset,
} from '@/features/tracking/hooks/useDateRange';

const PRESETS: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: 'all', label: 'All' },
];

interface DateRangeFilterProps {
    range: DateRange;
    onPreset: (preset: DateRangePreset) => void;
    onCustom?: (from: string, to: string) => void;
}

export function DateRangeFilter({ range, onPreset }: DateRangeFilterProps) {
    return (
        <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 self-start">
            {PRESETS.map((p) => (
                <button
                    key={p.id}
                    onClick={() => onPreset(p.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        range.preset === p.id
                            ? 'bg-indigo-500 text-white'
                            : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
