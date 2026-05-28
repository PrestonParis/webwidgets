'use client';

import {
    ISSUE_TRIGGERS,
    type IssueTrigger,
} from '@/features/tracking/health/lib/bodyIssues';

const labelCls =
    'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';

interface TriggerPickerProps {
    value: IssueTrigger[];
    onChange: (triggers: IssueTrigger[]) => void;
}

export function TriggerPicker({ value, onChange }: TriggerPickerProps) {
    function toggle(t: IssueTrigger) {
        onChange(
            value.includes(t) ? value.filter((x) => x !== t) : [...value, t],
        );
    }

    return (
        <div>
            <p className={labelCls}>
                Triggers <span className="font-normal">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
                {ISSUE_TRIGGERS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => toggle(t.id)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${value.includes(t.id) ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300' : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
