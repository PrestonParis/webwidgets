'use client';

import { MOOD_LABELS, ENERGY_LABELS } from '@/features/tracking/labels';
import { Smile } from 'lucide-react';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';

interface MoodFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';
const SCORES = [1, 2, 3, 4, 5] as const;

export function MoodFields({ form, updateField }: MoodFieldsProps) {
    const score = form.moodScore ?? 3;
    const energy = form.energy ?? 3;

    return (
        <div className="space-y-4">
            <div>
                <label className={labelCls}>
                    Mood:{' '}
                    <span className="text-indigo-500">
                        {MOOD_LABELS[score]}
                    </span>
                </label>
                <div className="flex gap-2 mt-1">
                    {SCORES.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => updateField('moodScore', s)}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-xs transition-colors ${
                                score === s
                                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                                    : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300'
                            }`}
                        >
                            <Smile className="h-4 w-4" aria-hidden="true" />
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                                {s}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className={labelCls}>
                    Energy:{' '}
                    <span className="text-indigo-500">
                        {ENERGY_LABELS[energy]}
                    </span>
                </label>
                <input
                    type="range"
                    min={1}
                    max={5}
                    value={energy}
                    onChange={(e) =>
                        updateField('energy', parseInt(e.target.value, 10))
                    }
                    className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    <span>Drained</span>
                    <span>Buzzing</span>
                </div>
            </div>
        </div>
    );
}
