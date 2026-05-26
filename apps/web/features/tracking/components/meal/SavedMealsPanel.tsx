'use client';

import { useState } from 'react';
import { useSavedMeals } from '@/features/tracking/hooks/useSavedMeals';
import { savedMealToEntry } from '@/features/tracking/lib/meal/nutrition/savedMealStore';
import {
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ICONS,
    MEAL_TYPE_ORDER,
    type MealType,
} from '@/features/tracking/lib/meal/mealDomain';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';
import type { SavedMealRecord } from '@/features/tracking/lib/meal/nutrition/types';

interface SavedMealsPanelProps {
    onLog: (entry: BaseTrackingEntry) => Promise<void>;
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function SavedMealsPanel({ onLog }: SavedMealsPanelProps) {
    const { savedMeals, remove } = useSavedMeals();
    const [multipliers, setMultipliers] = useState<Record<string, number>>({});

    if (!NUTRITION_FLAGS.savedMeals) {
        return (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">
                Saved meals are not available.
            </p>
        );
    }

    const grouped = MEAL_TYPE_ORDER.map((type) => ({
        type,
        meals: savedMeals.filter((m) => m.mealType === type),
    })).filter((g) => g.meals.length > 0);

    const logMeal = async (meal: SavedMealRecord) => {
        const multiplier = multipliers[meal.id] ?? meal.servingMultiplier ?? 1;
        await onLog(savedMealToEntry(meal, { date: todayKey(), multiplier }));
    };

    if (savedMeals.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No saved meals yet. Save a logged meal as a template to re-log
                it quickly.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {grouped.map((group) => (
                <div key={group.type}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-2">
                        {MEAL_TYPE_ICONS[group.type as MealType]}{' '}
                        {MEAL_TYPE_LABELS[group.type as MealType]}
                    </p>
                    <ul className="space-y-2">
                        {group.meals.map((m) => {
                            const multiplier =
                                multipliers[m.id] ?? m.servingMultiplier ?? 1;
                            return (
                                <li
                                    key={m.id}
                                    className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">
                                                {m.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                                {Math.round(
                                                    m.nutrition.calories *
                                                        multiplier,
                                                )}{' '}
                                                kcal ·{' '}
                                                {Math.round(
                                                    m.nutrition.proteinGrams *
                                                        multiplier,
                                                )}
                                                g protein · {m.items.length}{' '}
                                                item
                                                {m.items.length === 1
                                                    ? ''
                                                    : 's'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(m.id)}
                                            aria-label={`Delete saved meal ${m.name}`}
                                            className="text-xs text-red-400 hover:text-red-600 shrink-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <label
                                            htmlFor={`mult-${m.id}`}
                                            className="text-[11px] text-gray-500 dark:text-zinc-400"
                                        >
                                            Servings
                                        </label>
                                        <input
                                            id={`mult-${m.id}`}
                                            type="number"
                                            min={0.25}
                                            step={0.25}
                                            value={multiplier}
                                            onChange={(e) =>
                                                setMultipliers((prev) => ({
                                                    ...prev,
                                                    [m.id]:
                                                        parseFloat(
                                                            e.target.value,
                                                        ) || 1,
                                                }))
                                            }
                                            className="w-16 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void logMeal(m)}
                                            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                                        >
                                            Log now
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
}
