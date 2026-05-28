'use client';

import { useMemo } from 'react';
import {
    MEAL_TYPE_ICONS,
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ORDER,
    groupByMealType,
} from '@/features/tracking/lib/meal/helpers';
import type { MealRecord } from '@/features/tracking/lib/meal/types';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

interface MealTodayViewProps {
    records: MealRecord[];
    onEdit: (r: MealRecord) => void;
    onDelete: (id: string) => void;
}

export function MealTodayView({
    records,
    onEdit,
    onDelete,
}: MealTodayViewProps) {
    const today = todayKey();
    const todayRecords = records.filter((r) => r.date === today);
    const grouped = useMemo(
        () => groupByMealType(todayRecords),
        [todayRecords],
    );

    if (todayRecords.length === 0) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                Nothing logged today.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {MEAL_TYPE_ORDER.filter((t) => grouped[t].length > 0).map(
                (mealType) => (
                    <div key={mealType}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1">
                            {MEAL_TYPE_ICONS[mealType]}{' '}
                            {MEAL_TYPE_LABELS[mealType]}
                        </p>
                        <div className="space-y-1">
                            {grouped[mealType].map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
                                            {r.title ??
                                                MEAL_TYPE_LABELS[mealType]}
                                        </p>
                                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                                            {[
                                                r.calories !== null
                                                    ? `${Math.round(r.calories)} kcal`
                                                    : null,
                                                r.proteinGrams !== null
                                                    ? `${Math.round(r.proteinGrams)}g protein`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(r)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-600"
                                            aria-label={`Edit ${r.title ?? mealType}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(r.id)}
                                            className="text-[10px] text-red-400 hover:text-red-600"
                                            aria-label={`Delete ${r.title ?? mealType}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ),
            )}
        </div>
    );
}
