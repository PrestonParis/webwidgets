'use client';

import { useMemo, useState } from 'react';
import { FoodSearchPanel } from './FoodSearchPanel';
import { BarcodeModal } from './BarcodeModal';
import { useSavedMeals } from '@/features/tracking/hooks/useSavedMeals';
import {
    foodResultToMealMetadata,
    readFoodItems,
} from '@/features/tracking/lib/meal/nutrition/foodItem';
import { draftFromMealRecord } from '@/features/tracking/lib/meal/nutrition/savedMealStore';
import {
    groupByMealType,
    formatMealTime,
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ICONS,
    MEAL_TYPE_ORDER,
} from '@/features/tracking/lib/meal/helpers';
import type { MealRecord, MealType } from '@/features/tracking/lib/meal/types';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { FoodSearchResult } from '@/features/tracking/lib/meal/nutrition/foodTypes';

interface NutritionTodayPanelProps {
    records: MealRecord[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onEdit: (record: MealRecord) => void;
    onDelete: (id: string) => void;
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function NutritionTodayPanel({
    records,
    onAdd,
    onEdit,
    onDelete,
}: NutritionTodayPanelProps) {
    const today = todayKey();
    const todayRecords = useMemo(
        () => records.filter((r) => r.date === today),
        [records, today],
    );
    const grouped = useMemo(
        () => groupByMealType(todayRecords),
        [todayRecords],
    );
    const { create: createSavedMeal } = useSavedMeals();

    const [selected, setSelected] = useState<FoodSearchResult | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [mealType, setMealType] = useState<MealType>('lunch');
    const [showBarcode, setShowBarcode] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const lastMeal = records[0] ?? null;

    const handleFoodSelected = (result: FoodSearchResult) => {
        setSelected(result);
        setQuantity(1);
    };

    const handleLogSelected = async () => {
        if (!selected) return;
        const metadata = foodResultToMealMetadata(selected, {
            quantity,
            mealType,
        });
        await onAdd({
            category: 'meal',
            entryDate: today,
            metadata,
            tags: [],
            source: 'manual',
        });
        setSelected(null);
        setStatusMsg(`Logged ${selected.name}.`);
    };

    const handleRepeatLast = async () => {
        if (!lastMeal) return;
        const raw = lastMeal.raw;
        await onAdd({
            category: 'meal',
            entryDate: today,
            metadata: { ...raw.metadata },
            tags: raw.tags ?? [],
            source: 'manual',
            ...(raw.notes !== undefined ? { notes: raw.notes } : {}),
        });
        setStatusMsg('Repeated last meal.');
    };

    const handleSaveAsTemplate = (record: MealRecord) => {
        const items = readFoodItems(record.raw);
        const draft = draftFromMealRecord({
            name: record.title ?? MEAL_TYPE_LABELS[record.mealType ?? 'other'],
            mealType: record.mealType ?? 'other',
            items:
                items.length > 0
                    ? items
                    : [
                          {
                              id: `tpl-${record.id}`,
                              name: record.title ?? 'Meal',
                              quantity: record.servings ?? 1,
                              servingSize: 1,
                              servingUnit: 'serving',
                              calories: record.calories ?? 0,
                              proteinGrams: record.proteinGrams ?? 0,
                              carbsGrams: record.carbsGrams ?? 0,
                              fatGrams: record.fatGrams ?? 0,
                              source: 'manual' as const,
                              ...(record.fiberGrams !== null
                                  ? { fiberGrams: record.fiberGrams }
                                  : {}),
                          },
                      ],
        });
        createSavedMeal(draft);
        setStatusMsg('Saved as template.');
    };

    return (
        <div className="space-y-5">
            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap">
                {NUTRITION_FLAGS.barcodeScan && (
                    <button
                        type="button"
                        onClick={() => setShowBarcode(true)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 transition-colors"
                    >
                        Scan barcode
                    </button>
                )}
                {lastMeal && (
                    <button
                        type="button"
                        onClick={() => void handleRepeatLast()}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 transition-colors"
                    >
                        Repeat last meal
                    </button>
                )}
            </div>

            {statusMsg && (
                <p
                    className="text-xs text-green-600 dark:text-green-400"
                    role="status"
                >
                    {statusMsg}
                </p>
            )}

            {/* Food search */}
            <div className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Add a food
                </p>
                <FoodSearchPanel
                    onSelect={handleFoodSelected}
                    onScanBarcode={() => setShowBarcode(true)}
                />

                {selected && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                            {selected.name}
                            {selected.brand && (
                                <span className="text-gray-400 dark:text-zinc-500 font-normal">
                                    {' '}
                                    · {selected.brand}
                                </span>
                            )}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label
                                    htmlFor="today-qty"
                                    className="block text-[11px] text-gray-500 dark:text-zinc-400 mb-1"
                                >
                                    Servings
                                </label>
                                <input
                                    id="today-qty"
                                    type="number"
                                    min={0.25}
                                    step={0.25}
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            parseFloat(e.target.value) || 1,
                                        )
                                    }
                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="today-type"
                                    className="block text-[11px] text-gray-500 dark:text-zinc-400 mb-1"
                                >
                                    Meal type
                                </label>
                                <select
                                    id="today-type"
                                    value={mealType}
                                    onChange={(e) =>
                                        setMealType(e.target.value as MealType)
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
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                            {Math.round(selected.calories * quantity)} kcal ·{' '}
                            {Math.round(selected.proteinGrams * quantity)}g
                            protein
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleLogSelected()}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium"
                            >
                                Log food
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Today's meals grouped */}
            <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Today&apos;s meals
                </p>
                {todayRecords.length === 0 ? (
                    <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-6">
                        Nothing logged today yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {MEAL_TYPE_ORDER.filter(
                            (t) => grouped[t].length > 0,
                        ).map((type) => (
                            <div key={type}>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1">
                                    {MEAL_TYPE_ICONS[type]}{' '}
                                    {MEAL_TYPE_LABELS[type]}
                                </p>
                                <div className="space-y-1">
                                    {grouped[type].map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50 group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                                                    {r.title ??
                                                        MEAL_TYPE_LABELS[type]}
                                                </p>
                                                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                                    {[
                                                        r.calories !== null
                                                            ? `${Math.round(r.calories)} kcal`
                                                            : null,
                                                        r.proteinGrams !== null
                                                            ? `${Math.round(r.proteinGrams)}g protein`
                                                            : null,
                                                        formatMealTime(r) ||
                                                            null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {NUTRITION_FLAGS.savedMeals && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSaveAsTemplate(
                                                                r,
                                                            )
                                                        }
                                                        className="text-[11px] text-green-600 hover:text-green-700"
                                                        aria-label={`Save ${r.title ?? 'meal'} as template`}
                                                    >
                                                        Save
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(r)}
                                                    className="text-[11px] text-indigo-400 hover:text-indigo-600"
                                                    aria-label={`Edit ${r.title ?? 'meal'}`}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDelete(r.id)
                                                    }
                                                    className="text-[11px] text-red-400 hover:text-red-600"
                                                    aria-label={`Delete ${r.title ?? 'meal'}`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BarcodeModal
                open={showBarcode}
                onClose={() => setShowBarcode(false)}
                onResult={(r) => handleFoodSelected(r)}
            />
        </div>
    );
}
