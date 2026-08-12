'use client';

import {
    MEAL_TYPE_ICONS,
    MEAL_TYPE_LABELS,
} from '@/features/tracking/lib/meal/helpers';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import type { MealRecord } from '@/features/tracking/types/meal';
import { TrackingIcon } from './TrackingIcon';

interface MealHistoryViewProps {
    records: MealRecord[];
    onEdit: (r: MealRecord) => void;
    onDelete: (id: string) => void;
}

export function MealHistoryView({
    records,
    onEdit,
    onDelete,
}: MealHistoryViewProps) {
    if (records.length === 0) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                No meal history yet.
            </p>
        );
    }

    const byDate = new Map<string, MealRecord[]>();
    for (const r of records) {
        const list = byDate.get(r.date) ?? [];
        list.push(r);
        byDate.set(r.date, list);
    }

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {Array.from(byDate.entries()).map(([date, dayRecords]) => (
                <div key={date}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1 sticky top-0 bg-white dark:bg-zinc-900 py-0.5">
                        {formatDate(date)}
                    </p>
                    <div className="space-y-1">
                        {dayRecords.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                            >
                                <TrackingIcon
                                    name={
                                        r.mealType
                                            ? MEAL_TYPE_ICONS[r.mealType]
                                            : 'Utensils'
                                    }
                                    className="h-4 w-4 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                        {r.title ??
                                            (r.mealType
                                                ? MEAL_TYPE_LABELS[r.mealType]
                                                : 'Meal')}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
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
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(r)}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-600"
                                        aria-label={`Edit ${r.title ?? 'meal'}`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(r.id)}
                                        className="text-[10px] text-red-400 hover:text-red-600"
                                        aria-label={`Delete ${r.title ?? 'meal'}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
