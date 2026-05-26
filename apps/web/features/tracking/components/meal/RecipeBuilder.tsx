'use client';

import { useMemo, useState } from 'react';
import { FoodSearchPanel } from './FoodSearchPanel';
import { computeRecipeNutrition } from '@/features/tracking/lib/meal/nutrition/providers/recipeProvider';
import { foodResultToItem } from '@/features/tracking/lib/meal/nutrition/normalize';
import type {
    FoodItem,
    FoodSearchResult,
    RecipeDraft,
    RecipeRecord,
} from '@/features/tracking/lib/meal/nutrition/types';

interface RecipeBuilderProps {
    initial?: RecipeRecord;
    onSave: (draft: RecipeDraft) => void;
    onCancel: () => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-green-400';

function makeItemId(): string {
    return `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function RecipeBuilder({
    initial,
    onSave,
    onCancel,
}: RecipeBuilderProps) {
    const [name, setName] = useState(initial?.name ?? '');
    const [servings, setServings] = useState(initial?.servings ?? 1);
    const [notes, setNotes] = useState(initial?.notes ?? '');
    const [ingredients, setIngredients] = useState<FoodItem[]>(
        initial?.ingredients ?? [],
    );
    const [error, setError] = useState('');

    const nutrition = useMemo(
        () => computeRecipeNutrition(ingredients, servings),
        [ingredients, servings],
    );

    const addIngredient = (result: FoodSearchResult) => {
        setIngredients((prev) => [
            ...prev,
            foodResultToItem(result, 1, makeItemId()),
        ]);
    };

    const updateQuantity = (id: string, quantity: number) => {
        setIngredients((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;
                const ratio =
                    quantity > 0 && it.quantity > 0
                        ? quantity / it.quantity
                        : 1;
                const updated: FoodItem = {
                    ...it,
                    quantity,
                    calories: Math.round(it.calories * ratio),
                    proteinGrams: Math.round(it.proteinGrams * ratio * 10) / 10,
                    carbsGrams: Math.round(it.carbsGrams * ratio * 10) / 10,
                    fatGrams: Math.round(it.fatGrams * ratio * 10) / 10,
                };
                return updated;
            }),
        );
    };

    const removeIngredient = (id: string) => {
        setIngredients((prev) => prev.filter((it) => it.id !== id));
    };

    const handleSave = () => {
        if (name.trim().length === 0) {
            setError('Give your recipe a name.');
            return;
        }
        if (ingredients.length === 0) {
            setError('Add at least one ingredient.');
            return;
        }
        if (servings <= 0) {
            setError('Servings must be at least 1.');
            return;
        }
        const draft: RecipeDraft = {
            name: name.trim(),
            servings,
            ingredients,
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        };
        onSave(draft);
    };

    return (
        <div className="space-y-4 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                    <label
                        htmlFor="recipe-name"
                        className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1"
                    >
                        Recipe name
                    </label>
                    <input
                        id="recipe-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        placeholder="e.g. Chicken stir-fry"
                        className={inputCls}
                    />
                </div>
                <div>
                    <label
                        htmlFor="recipe-servings"
                        className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1"
                    >
                        Servings
                    </label>
                    <input
                        id="recipe-servings"
                        type="number"
                        min={1}
                        step={1}
                        value={servings}
                        onChange={(e) =>
                            setServings(
                                Math.max(1, parseInt(e.target.value, 10) || 1),
                            )
                        }
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Ingredient list */}
            <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Ingredients ({ingredients.length})
                </p>
                {ingredients.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">
                        No ingredients yet. Search below to add foods.
                    </p>
                ) : (
                    <ul className="space-y-1 mb-3">
                        {ingredients.map((it) => (
                            <li
                                key={it.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                            >
                                <span className="flex-1 min-w-0 text-sm text-gray-800 dark:text-zinc-200 truncate">
                                    {it.name}
                                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 ml-1">
                                        {Math.round(it.calories)} kcal
                                    </span>
                                </span>
                                <label
                                    className="sr-only"
                                    htmlFor={`qty-${it.id}`}
                                >
                                    Quantity for {it.name}
                                </label>
                                <input
                                    id={`qty-${it.id}`}
                                    type="number"
                                    min={0.25}
                                    step={0.25}
                                    value={it.quantity}
                                    onChange={(e) =>
                                        updateQuantity(
                                            it.id,
                                            parseFloat(e.target.value) || 1,
                                        )
                                    }
                                    className="w-16 px-1.5 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(it.id)}
                                    aria-label={`Remove ${it.name}`}
                                    className="text-red-400 hover:text-red-600 text-sm px-1"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <FoodSearchPanel onSelect={addIngredient} />
            </div>

            {/* Per-serving preview */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <p className="text-[10px] uppercase tracking-wide text-green-700 dark:text-green-300">
                        Per serving
                    </p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300 mt-0.5">
                        {Math.round(nutrition.perServing.calories)} kcal
                    </p>
                    <p className="text-[11px] text-green-600 dark:text-green-400">
                        {nutrition.perServing.proteinGrams}g P ·{' '}
                        {nutrition.perServing.carbsGrams}g C ·{' '}
                        {nutrition.perServing.fatGrams}g F
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                        Whole recipe
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-0.5">
                        {Math.round(nutrition.total.calories)} kcal
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        {nutrition.total.proteinGrams}g P ·{' '}
                        {nutrition.total.carbsGrams}g C ·{' '}
                        {nutrition.total.fatGrams}g F
                    </p>
                </div>
            </div>

            <div>
                <label
                    htmlFor="recipe-notes"
                    className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1"
                >
                    Notes (optional)
                </label>
                <textarea
                    id="recipe-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={inputCls}
                />
            </div>

            {error && (
                <p className="text-sm text-red-500" role="alert">
                    {error}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                >
                    {initial ? 'Update recipe' : 'Save recipe'}
                </button>
            </div>
        </div>
    );
}
