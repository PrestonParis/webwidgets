'use client';

import { QUALITY_LABELS } from '@/features/tracking/labels';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';

interface SleepFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

export function SleepFields({ form, updateField }: SleepFieldsProps) {
    const quality = form.quality ?? 7;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>Bedtime</label>
                    <input
                        type="time"
                        value={form.bedtime ?? ''}
                        onChange={(e) =>
                            updateField('bedtime', e.target.value || undefined)
                        }
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>
                        Wake Time{' '}
                        <span className="text-gray-400 dark:text-zinc-600 font-normal">
                            (next day)
                        </span>
                    </label>
                    <input
                        type="time"
                        value={form.wakeTime ?? ''}
                        onChange={(e) =>
                            updateField('wakeTime', e.target.value || undefined)
                        }
                        className={inputCls}
                    />
                </div>
            </div>
            <div>
                <label className={labelCls}>
                    Quality —{' '}
                    <span className="text-indigo-500">
                        {QUALITY_LABELS[quality] ?? quality}
                    </span>
                </label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={quality}
                    onChange={(e) =>
                        updateField('quality', parseInt(e.target.value, 10))
                    }
                    className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    <span>1</span>
                    <span>10</span>
                </div>
            </div>
        </div>
    );
}
