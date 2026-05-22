'use client';

import { COMMON_WORKOUT_TYPES } from '@/features/tracking/trackingData';
import { INTENSITY_LABELS } from '@/features/tracking/labels';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';

interface WorkoutFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

export function WorkoutFields({ form, updateField }: WorkoutFieldsProps) {
    const intensity = form.intensity ?? 5;

    return (
        <div className="space-y-3">
            <div>
                <label className={labelCls}>Type</label>
                <select
                    value={form.workoutType ?? ''}
                    onChange={(e) =>
                        updateField('workoutType', e.target.value || undefined)
                    }
                    className={inputCls}
                >
                    <option value="">Select type…</option>
                    {COMMON_WORKOUT_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={labelCls}>Duration (minutes)</label>
                <input
                    type="number"
                    min={1}
                    max={600}
                    placeholder="45"
                    value={form.duration ?? ''}
                    onChange={(e) =>
                        updateField(
                            'duration',
                            e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                        )
                    }
                    className={inputCls}
                />
            </div>
            <div>
                <label className={labelCls}>
                    Intensity —{' '}
                    <span className="text-indigo-500">
                        {INTENSITY_LABELS[intensity] ?? intensity}
                    </span>
                </label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={intensity}
                    onChange={(e) =>
                        updateField('intensity', parseInt(e.target.value, 10))
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
