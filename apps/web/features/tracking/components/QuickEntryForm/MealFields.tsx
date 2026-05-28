'use client';

import { useState } from 'react';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';
import {
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ORDER,
} from '@/features/tracking/lib/meal/helpers';

interface MealFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-green-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

/** Quick-log templates that pre-fill common values */
const QUICK_LOG_TEMPLATES = [
    { label: 'Snack', mealType: 'snack', calories: 200, protein: 10 },
    {
        label: 'Protein shake',
        mealType: 'snack',
        description: 'Protein shake',
        calories: 150,
        protein: 30,
        carbs: 5,
        fat: 3,
    },
] as const;

function numericField(
    val: number | undefined,
    onChange: (v: number | undefined) => void,
) {
    return {
        type: 'number' as const,
        min: 0,
        value: val ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value ? parseInt(e.target.value, 10) : undefined),
    };
}

export function MealFields({ form, updateField }: MealFieldsProps) {
    const [showMacros, setShowMacros] = useState(
        !!(
            form.carbs !== undefined ||
            form.fat !== undefined ||
            form.fiber !== undefined
        ),
    );

    const applyTemplate = (tpl: (typeof QUICK_LOG_TEMPLATES)[number]) => {
        updateField('mealType', tpl.mealType);
        if ('description' in tpl && tpl.description)
            updateField('description', tpl.description);
        updateField('calories', tpl.calories);
        updateField('protein', tpl.protein);
        if ('carbs' in tpl) updateField('carbs', tpl.carbs);
        if ('fat' in tpl) updateField('fat', tpl.fat);
    };

    return (
        <div className="space-y-3">
            {/* Quick-log chips */}
            <div className="flex gap-1.5 flex-wrap">
                {QUICK_LOG_TEMPLATES.map((tpl) => (
                    <button
                        key={tpl.label}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                        {tpl.label}
                    </button>
                ))}
            </div>

            {/* Meal type + time */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="meal-type" className={labelCls}>
                        Meal type
                    </label>
                    <select
                        id="meal-type"
                        value={form.mealType ?? ''}
                        onChange={(e) =>
                            updateField('mealType', e.target.value || undefined)
                        }
                        className={inputCls}
                    >
                        <option value="">Select…</option>
                        {MEAL_TYPE_ORDER.map((t) => (
                            <option key={t} value={t}>
                                {MEAL_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="meal-time" className={labelCls}>
                        Time
                    </label>
                    <input
                        id="meal-time"
                        type="time"
                        value={form.mealTime ?? ''}
                        onChange={(e) =>
                            updateField('mealTime', e.target.value || undefined)
                        }
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Meal name / description */}
            <div>
                <label htmlFor="meal-description" className={labelCls}>
                    Meal name
                </label>
                <input
                    id="meal-description"
                    type="text"
                    placeholder="What did you eat?"
                    value={form.description ?? ''}
                    onChange={(e) =>
                        updateField('description', e.target.value || undefined)
                    }
                    className={inputCls}
                />
            </div>

            {/* Calories + protein */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="meal-calories" className={labelCls}>
                        Calories (kcal)
                    </label>
                    <input
                        id="meal-calories"
                        placeholder="0"
                        className={inputCls}
                        {...numericField(form.calories, (v) =>
                            updateField('calories', v),
                        )}
                    />
                </div>
                <div>
                    <label htmlFor="meal-protein" className={labelCls}>
                        Protein (g)
                    </label>
                    <input
                        id="meal-protein"
                        placeholder="0"
                        className={inputCls}
                        {...numericField(form.protein, (v) =>
                            updateField('protein', v),
                        )}
                    />
                </div>
            </div>

            {/* Servings */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="meal-servings" className={labelCls}>
                        Servings
                    </label>
                    <input
                        id="meal-servings"
                        type="number"
                        min={0.25}
                        step={0.25}
                        placeholder="1"
                        value={form.servings ?? ''}
                        onChange={(e) =>
                            updateField(
                                'servings',
                                e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                            )
                        }
                        className={inputCls}
                    />
                </div>
                {/* Expand macros toggle */}
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={() => setShowMacros((v) => !v)}
                        className="text-[11px] text-green-500 hover:text-green-600 transition-colors pb-1.5"
                    >
                        {showMacros ? '− Hide macros' : '+ Add macros'}
                    </button>
                </div>
            </div>

            {/* Optional macro fields */}
            {showMacros && (
                <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                    <div>
                        <label htmlFor="meal-carbs" className={labelCls}>
                            Carbs (g)
                        </label>
                        <input
                            id="meal-carbs"
                            placeholder="0"
                            className={inputCls}
                            {...numericField(form.carbs, (v) =>
                                updateField('carbs', v),
                            )}
                        />
                    </div>
                    <div>
                        <label htmlFor="meal-fat" className={labelCls}>
                            Fat (g)
                        </label>
                        <input
                            id="meal-fat"
                            placeholder="0"
                            className={inputCls}
                            {...numericField(form.fat, (v) =>
                                updateField('fat', v),
                            )}
                        />
                    </div>
                    <div>
                        <label htmlFor="meal-fiber" className={labelCls}>
                            Fiber (g)
                        </label>
                        <input
                            id="meal-fiber"
                            placeholder="0"
                            className={inputCls}
                            {...numericField(form.fiber, (v) =>
                                updateField('fiber', v),
                            )}
                        />
                    </div>
                    {/* TODO: Add sugar, sodium fields when those are persisted */}
                </div>
            )}
        </div>
    );
}
