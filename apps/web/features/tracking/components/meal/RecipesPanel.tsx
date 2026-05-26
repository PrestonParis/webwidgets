'use client';

import { useState } from 'react';
import { RecipeBuilder } from './RecipeBuilder';
import { useRecipes } from '@/features/tracking/hooks/useRecipes';
import { recipeToMealEntry } from '@/features/tracking/lib/meal/nutrition/providers/recipeProvider';
import {
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ORDER,
    type MealType,
} from '@/features/tracking/lib/meal/mealDomain';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';
import type { RecipeRecord } from '@/features/tracking/lib/meal/nutrition/types';

interface RecipesPanelProps {
    onLog: (entry: BaseTrackingEntry) => Promise<void>;
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function RecipesPanel({ onLog }: RecipesPanelProps) {
    const { recipes, create, update, remove } = useRecipes();
    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [editing, setEditing] = useState<RecipeRecord | null>(null);
    const [logging, setLogging] = useState<RecipeRecord | null>(null);
    const [logMealType, setLogMealType] = useState<MealType>('dinner');
    const [logServings, setLogServings] = useState(1);

    if (!NUTRITION_FLAGS.recipes) {
        return (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">
                Recipes are not available.
            </p>
        );
    }

    if (mode === 'create' || (mode === 'edit' && editing)) {
        return (
            <RecipeBuilder
                {...(mode === 'edit' && editing ? { initial: editing } : {})}
                onSave={(draft) => {
                    if (mode === 'edit' && editing) update(editing.id, draft);
                    else create(draft);
                    setMode('list');
                    setEditing(null);
                }}
                onCancel={() => {
                    setMode('list');
                    setEditing(null);
                }}
            />
        );
    }

    const handleLog = async () => {
        if (!logging) return;
        const entry = recipeToMealEntry(logging, {
            date: todayKey(),
            mealType: logMealType,
            servingsLogged: logServings,
        });
        await onLog(entry);
        setLogging(null);
        setLogServings(1);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    Recipes ({recipes.length})
                </p>
                <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                >
                    + New recipe
                </button>
            </div>

            {recipes.length === 0 ? (
                <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                    No recipes yet. Build one to log it as a meal in one tap.
                </p>
            ) : (
                <ul className="space-y-2">
                    {recipes.map((r) => (
                        <li
                            key={r.id}
                            className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">
                                        {r.name}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                        {r.servings} servings ·{' '}
                                        {Math.round(
                                            r.perServingNutrition.calories,
                                        )}{' '}
                                        kcal/serving ·{' '}
                                        {r.perServingNutrition.proteinGrams}g
                                        protein
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setLogging(r)}
                                        className="text-xs text-green-600 hover:text-green-700"
                                    >
                                        Log
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(r);
                                            setMode('edit');
                                        }}
                                        className="text-xs text-indigo-400 hover:text-indigo-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(r.id)}
                                        aria-label={`Delete recipe ${r.name}`}
                                        className="text-xs text-red-400 hover:text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {logging?.id === r.id && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label
                                                htmlFor={`log-type-${r.id}`}
                                                className="block text-[11px] text-gray-500 dark:text-zinc-400 mb-1"
                                            >
                                                Meal type
                                            </label>
                                            <select
                                                id={`log-type-${r.id}`}
                                                value={logMealType}
                                                onChange={(e) =>
                                                    setLogMealType(
                                                        e.target
                                                            .value as MealType,
                                                    )
                                                }
                                                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                            >
                                                {MEAL_TYPE_ORDER.map((t) => (
                                                    <option key={t} value={t}>
                                                        {MEAL_TYPE_LABELS[t]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor={`log-serv-${r.id}`}
                                                className="block text-[11px] text-gray-500 dark:text-zinc-400 mb-1"
                                            >
                                                Servings to log
                                            </label>
                                            <input
                                                id={`log-serv-${r.id}`}
                                                type="number"
                                                min={0.25}
                                                step={0.25}
                                                value={logServings}
                                                onChange={(e) =>
                                                    setLogServings(
                                                        parseFloat(
                                                            e.target.value,
                                                        ) || 1,
                                                    )
                                                }
                                                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLogging(null)}
                                            className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleLog()}
                                            className="flex-1 text-xs py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium"
                                        >
                                            Log meal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
