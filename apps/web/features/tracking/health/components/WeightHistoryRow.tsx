'use client';

import {
    BMI_CATEGORY_COLOR,
    fmtWeight,
    getBMICategory,
    type WeightEntry,
    type WeightUnit,
} from '@/features/tracking/health/lib/weightDomain';

interface WeightHistoryRowProps {
    entry: WeightEntry;
    unit: WeightUnit;
    onDelete: () => void;
}

export function WeightHistoryRow({
    entry,
    unit,
    onDelete,
}: WeightHistoryRowProps) {
    const bmiCategory = entry.bmi != null ? getBMICategory(entry.bmi) : null;
    return (
        <div className="group flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5">
            <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {fmtWeight(entry.weightKg, unit)}
                    </span>
                    {entry.bmi != null && bmiCategory && (
                        <span
                            className={`text-xs ${BMI_CATEGORY_COLOR[bmiCategory]}`}
                        >
                            BMI {entry.bmi.toFixed(1)}
                        </span>
                    )}
                    {entry.bodyFatPercent != null && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            {entry.bodyFatPercent.toFixed(1)}% fat
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {entry.date}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                </p>
            </div>
            <button
                type="button"
                onClick={onDelete}
                className="ml-3 shrink-0 text-[11px] text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                aria-label={`Delete weight entry for ${entry.date}`}
            >
                Delete
            </button>
        </div>
    );
}
