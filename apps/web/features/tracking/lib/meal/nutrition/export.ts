/**
 * Nutrition CSV export.
 *
 * Builds CSV strings for meal history and daily summaries. The actual file
 * download is handled by a tiny browser helper so the CSV builders stay pure
 * and testable.
 */

import type { MealRecord } from '@/features/tracking/types/meal';

function csvCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
    const lines = [headers.map(csvCell).join(',')];
    for (const row of rows) lines.push(row.map(csvCell).join(','));
    return lines.join('\n');
}

/** One row per logged meal. */
export function buildMealHistoryCsv(records: MealRecord[]): string {
    const headers = [
        'date',
        'time',
        'meal_type',
        'name',
        'calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'fiber_g',
        'servings',
        'notes',
    ];
    const rows = records.map((r) => [
        r.date,
        r.time ?? '',
        r.mealType ?? '',
        r.title ?? '',
        r.calories,
        r.proteinGrams,
        r.carbsGrams,
        r.fatGrams,
        r.fiberGrams,
        r.servings,
        r.notes ?? '',
    ]);
    return toCsv(headers, rows);
}

/** One row per day with summed totals. */
export function buildDailySummaryCsv(records: MealRecord[]): string {
    const byDate = new Map<string, MealRecord[]>();
    for (const r of records) {
        const list = byDate.get(r.date) ?? [];
        list.push(r);
        byDate.set(r.date, list);
    }
    const headers = [
        'date',
        'meals',
        'calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'fiber_g',
    ];
    const rows = Array.from(byDate.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, day]) => {
            const sum = (f: keyof MealRecord) =>
                Math.round(
                    day.reduce((acc, r) => {
                        const value = r[f];
                        return acc + (typeof value === 'number' ? value : 0);
                    }, 0),
                );
            return [
                date,
                day.length,
                sum('calories'),
                sum('proteinGrams'),
                sum('carbsGrams'),
                sum('fatGrams'),
                sum('fiberGrams'),
            ];
        });
    return toCsv(headers, rows);
}

/** Trigger a browser download of CSV content. No-op outside the browser. */
export function downloadCsv(filename: string, content: string): void {
    if (typeof document === 'undefined') return;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
