import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { MealRecord, MealType } from './types';

function isMealType(value: unknown): value is MealType {
    return (
        typeof value === 'string' &&
        ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(value)
    );
}

export function normalizeMealEntry(entry: TrackingEntry): MealRecord {
    const m = entry.metadata;

    const time = typeof m['time'] === 'string' ? m['time'] : null;
    const mealType = isMealType(m['mealType']) ? m['mealType'] : null;
    const title =
        typeof m['description'] === 'string' && m['description']
            ? m['description']
            : null;
    const calories =
        typeof m['calories'] === 'number' && m['calories'] >= 0
            ? m['calories']
            : null;
    const proteinGrams =
        typeof m['protein'] === 'number' && m['protein'] >= 0
            ? m['protein']
            : null;
    const carbsGrams =
        typeof m['carbs'] === 'number' && m['carbs'] >= 0 ? m['carbs'] : null;
    const fatGrams =
        typeof m['fat'] === 'number' && m['fat'] >= 0 ? m['fat'] : null;
    const fiberGrams =
        typeof m['fiber'] === 'number' && m['fiber'] >= 0 ? m['fiber'] : null;
    const servings =
        typeof m['servings'] === 'number' && m['servings'] > 0
            ? m['servings']
            : null;

    return {
        id: entry.id,
        date: entry.entryDate,
        time,
        mealType,
        title,
        calories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        fiberGrams,
        servings,
        notes: entry.notes ?? null,
        source: entry.source,
        raw: entry,
    };
}

/** Returns meal records sorted newest-first. */
export function normalizeMealEntries(entries: TrackingEntry[]): MealRecord[] {
    return entries
        .filter((e) => e.category === 'meal')
        .map(normalizeMealEntry)
        .sort((a, b) => {
            const dateDiff = b.date.localeCompare(a.date);
            if (dateDiff !== 0) return dateDiff;
            // Secondary sort by time within same date (newest first)
            if (a.time && b.time) return b.time.localeCompare(a.time);
            return 0;
        });
}
