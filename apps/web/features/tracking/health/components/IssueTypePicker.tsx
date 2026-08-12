'use client';

import { ISSUE_TYPES } from '@/features/tracking/health/lib/bodyIssues';
import { TrackingIcon } from '@/features/tracking/components/TrackingIcon';

const labelCls =
    'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';

interface IssueTypePickerProps {
    value: string;
    onChange: (id: string) => void;
    error?: string;
}

export function IssueTypePicker({
    value,
    onChange,
    error,
}: IssueTypePickerProps) {
    return (
        <div>
            <p className={labelCls}>Issue type</p>
            <div className="flex flex-wrap gap-1.5">
                {ISSUE_TYPES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onChange(t.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${value === t.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'}`}
                    >
                        <TrackingIcon name={t.icon} className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
