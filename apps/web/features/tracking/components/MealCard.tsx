'use client';

import {
    MEAL_TYPE_ICONS,
    MEAL_TYPE_LABELS,
    formatMealTime,
} from '@/features/tracking/lib/meal/helpers';
import type { MealRecord } from '@/features/tracking/types/meal';
import { TrackingIcon } from './TrackingIcon';

export function MealCard({ record }: { record: MealRecord }) {
    const icon = record.mealType
        ? MEAL_TYPE_ICONS[record.mealType]
        : 'Utensils';
    return (
        <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5">
            <TrackingIcon name={icon} className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
                    {record.title ??
                        (record.mealType
                            ? MEAL_TYPE_LABELS[record.mealType]
                            : 'Meal')}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                    {[
                        record.calories !== null
                            ? `${Math.round(record.calories)} kcal`
                            : null,
                        record.proteinGrams !== null
                            ? `${Math.round(record.proteinGrams)}g protein`
                            : null,
                        formatMealTime(record) || null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>
        </div>
    );
}
