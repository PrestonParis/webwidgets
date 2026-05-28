'use client';

import { useState } from 'react';
import {
    buildImportPreview,
    importRowToEntry,
} from '@/features/tracking/lib/meal/nutrition/providers/importProvider';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import type { MealRecord } from '@/features/tracking/types/meal';
import type {
    ExistingMealSignature,
    NutritionImportPreview,
} from '@/features/tracking/types/nutritionImport';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';

interface NutritionImportPanelProps {
    existingRecords: MealRecord[];
    onImport: (entries: BaseTrackingEntry[]) => Promise<void>;
}

const FORMAT_LABELS: Record<string, string> = {
    myfitnesspal: 'MyFitnessPal',
    cronometer: 'Cronometer',
    generic: 'Generic CSV',
    unknown: 'Unknown',
};

export function NutritionImportPanel({
    existingRecords,
    onImport,
}: NutritionImportPanelProps) {
    const [preview, setPreview] = useState<NutritionImportPreview | null>(null);
    const [error, setError] = useState('');
    const [importing, setImporting] = useState(false);
    const [done, setDone] = useState<number | null>(null);

    if (!NUTRITION_FLAGS.imports) {
        return (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">
                CSV import is not available.
            </p>
        );
    }

    const existingSignatures: ExistingMealSignature[] = existingRecords.map(
        (r) => ({
            date: r.date,
            mealType: r.mealType,
            calories: r.calories,
        }),
    );

    const handleFile = (file: File) => {
        setError('');
        setDone(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                setError('Could not read file.');
                return;
            }
            try {
                const result = buildImportPreview(content, existingSignatures);
                if (result.totalRows === 0) {
                    setError('No data rows found in this CSV.');
                    setPreview(null);
                    return;
                }
                setPreview(result);
            } catch {
                setError('Failed to parse CSV.');
            }
        };
        reader.onerror = () => setError('Could not read file.');
        reader.readAsText(file);
    };

    const handleConfirm = async () => {
        if (!preview) return;
        setImporting(true);
        try {
            const entries = preview.rows
                .map(importRowToEntry)
                .filter((e): e is BaseTrackingEntry => e !== null);
            await onImport(entries);
            setDone(entries.length);
            setPreview(null);
        } catch {
            setError('Import failed. Some rows may not have been saved.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    Import nutrition CSV
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Supports MyFitnessPal and Cronometer exports. Duplicate rows
                    (same date, meal, and calories) are skipped automatically.
                </p>
            </div>

            <div>
                <label
                    htmlFor="nutrition-import-file"
                    className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1"
                >
                    Choose CSV file
                </label>
                <input
                    id="nutrition-import-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                    className="text-xs text-gray-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-green-500 file:text-white file:text-xs file:font-medium hover:file:bg-green-600 file:cursor-pointer"
                />
            </div>

            {error && (
                <p className="text-sm text-red-500" role="alert">
                    {error}
                </p>
            )}

            {done !== null && (
                <p
                    className="text-sm text-green-600 dark:text-green-400"
                    role="status"
                >
                    Imported {done} meal{done === 1 ? '' : 's'}.
                </p>
            )}

            {preview && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Stat
                            label="Format"
                            value={
                                FORMAT_LABELS[preview.detectedFormat] ??
                                'Unknown'
                            }
                        />
                        <Stat
                            label="Total rows"
                            value={String(preview.totalRows)}
                        />
                        <Stat
                            label="Will import"
                            value={String(preview.validRows)}
                            accent="text-green-600 dark:text-green-400"
                        />
                        <Stat
                            label="Skipped"
                            value={String(
                                preview.duplicateRows + preview.errorRows,
                            )}
                            accent="text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        Detected columns:{' '}
                        {preview.detectedColumns.join(', ') || 'none'}
                    </p>

                    {/* Sample preview */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="text-left text-gray-400 dark:text-zinc-500">
                                    <th className="py-1 pr-2">Date</th>
                                    <th className="py-1 pr-2">Meal</th>
                                    <th className="py-1 pr-2">Name</th>
                                    <th className="py-1 pr-2">Cals</th>
                                    <th className="py-1 pr-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.sample.map((row) => (
                                    <tr
                                        key={row.rowIndex}
                                        className="border-t border-gray-100 dark:border-zinc-800"
                                    >
                                        <td className="py-1 pr-2 text-gray-700 dark:text-zinc-300">
                                            {row.date ?? '—'}
                                        </td>
                                        <td className="py-1 pr-2 text-gray-700 dark:text-zinc-300">
                                            {row.mealType ?? '—'}
                                        </td>
                                        <td className="py-1 pr-2 text-gray-700 dark:text-zinc-300 truncate max-w-[120px]">
                                            {row.name ?? '—'}
                                        </td>
                                        <td className="py-1 pr-2 text-gray-700 dark:text-zinc-300">
                                            {row.calories ?? '—'}
                                        </td>
                                        <td className="py-1 pr-2">
                                            {row.issues.length > 0 ? (
                                                <span className="text-red-500">
                                                    {row.issues[0]}
                                                </span>
                                            ) : row.duplicate ? (
                                                <span className="text-amber-500">
                                                    Duplicate
                                                </span>
                                            ) : (
                                                <span className="text-green-600">
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {preview.totalRows > 5 && (
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                                Showing first 5 of {preview.totalRows} rows.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPreview(null)}
                            className="flex-1 text-xs py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={importing || preview.validRows === 0}
                            className="flex-1 text-xs py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium transition-colors"
                        >
                            {importing
                                ? 'Importing…'
                                : `Import ${preview.validRows} meal${preview.validRows === 1 ? '' : 's'}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p
                className={`text-sm font-semibold ${accent ?? 'text-gray-800 dark:text-zinc-200'}`}
            >
                {value}
            </p>
        </div>
    );
}
