'use client';

import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/features/tracking/constants';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';

interface MealFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

export function MealFields({ form, updateField }: MealFieldsProps) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>Meal Type</label>
                    <select
                        value={form.mealType ?? ''}
                        onChange={(e) =>
                            updateField('mealType', e.target.value || undefined)
                        }
                        className={inputCls}
                    >
                        <option value="">Select…</option>
                        {MEAL_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {MEAL_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Time</label>
                    <input
                        type="time"
                        value={form.mealTime ?? ''}
                        onChange={(e) =>
                            updateField('mealTime', e.target.value || undefined)
                        }
                        className={inputCls}
                    />
                </div>
            </div>
            <div>
                <label className={labelCls}>Description</label>
                <input
                    type="text"
                    placeholder="What did you eat?"
                    value={form.description ?? ''}
                    onChange={(e) =>
                        updateField('description', e.target.value || undefined)
                    }
                    className={inputCls}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>Protein (g)</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.protein ?? ''}
                        onChange={(e) =>
                            updateField(
                                'protein',
                                e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                            )
                        }
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Calories</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={form.calories ?? ''}
                        onChange={(e) =>
                            updateField(
                                'calories',
                                e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                            )
                        }
                        className={inputCls}
                    />
                </div>
            </div>
        </div>
    );
}
