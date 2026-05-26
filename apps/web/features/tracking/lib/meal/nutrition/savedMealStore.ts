/**
 * Saved meal / template persistence.
 *
 * Like recipes, saved meals live in localStorage behind a SavedMealStore seam
 * so a DB-backed store can replace it later. A saved meal captures a set of food
 * items + meal type that can be re-logged with one click (optionally scaled by a
 * serving multiplier).
 */

import { sumFoodItems, foodItemToMetadata, scaleTotals } from './normalize';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';
import type { MealType } from '@/features/tracking/lib/meal/mealDomain';
import type { SavedMealDraft, SavedMealRecord } from './types';

const STORAGE_KEY = 'nutrition_saved_meals_v1';

export interface SavedMealStore {
    list(): SavedMealRecord[];
    get(id: string): SavedMealRecord | null;
    create(draft: SavedMealDraft): SavedMealRecord;
    update(id: string, draft: SavedMealDraft): SavedMealRecord | null;
    remove(id: string): void;
}

function readAll(): SavedMealRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as SavedMealRecord[]) : [];
    } catch {
        return [];
    }
}

function writeAll(records: SavedMealRecord[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
        console.error('[savedMealStore] failed to persist saved meals', err);
    }
}

function makeId(): string {
    return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSavedMealRecord(
    draft: SavedMealDraft,
    id: string,
    now = new Date().toISOString(),
): SavedMealRecord {
    return {
        id,
        name: draft.name,
        mealType: draft.mealType,
        items: draft.items,
        servingMultiplier: draft.servingMultiplier,
        nutrition: sumFoodItems(draft.items),
        createdAt: now,
    };
}

export const localSavedMealStore: SavedMealStore = {
    list() {
        return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    get(id) {
        return readAll().find((m) => m.id === id) ?? null;
    },
    create(draft) {
        const record = buildSavedMealRecord(draft, makeId());
        const all = readAll();
        all.push(record);
        writeAll(all);
        return record;
    },
    update(id, draft) {
        const all = readAll();
        const idx = all.findIndex((m) => m.id === id);
        if (idx < 0) return null;
        const updated = buildSavedMealRecord(draft, id, all[idx]!.createdAt);
        all[idx] = updated;
        writeAll(all);
        return updated;
    },
    remove(id) {
        writeAll(readAll().filter((m) => m.id !== id));
    },
};

/**
 * Convert a saved meal into a loggable entry, scaled by a serving multiplier.
 * The default multiplier comes from the saved meal but can be overridden.
 */
export function savedMealToEntry(
    meal: SavedMealRecord,
    opts: { date: string; multiplier?: number; time?: string },
): BaseTrackingEntry {
    const factor = opts.multiplier ?? meal.servingMultiplier ?? 1;
    const scaled = scaleTotals(meal.nutrition, factor);
    const metadata: Record<string, unknown> = {
        mealType: meal.mealType,
        description: meal.name,
        templateId: meal.id,
        source: 'template',
        calories: Math.round(scaled.calories),
        protein: scaled.proteinGrams,
        carbs: scaled.carbsGrams,
        fat: scaled.fatGrams,
        fiber: scaled.fiberGrams,
        servings: factor,
        items: meal.items.map(foodItemToMetadata),
    };
    if (opts.time) metadata['time'] = opts.time;
    return {
        category: 'meal',
        entryDate: opts.date,
        metadata,
        tags: ['template'],
        source: 'manual',
    };
}

/**
 * Build a saved-meal draft from an existing logged meal (Save as template).
 * Falls back to a single synthetic food item when the entry has no structured
 * items array (legacy entries).
 */
export function draftFromMealRecord(input: {
    name: string;
    mealType: MealType;
    items: SavedMealRecord['items'];
}): SavedMealDraft {
    return {
        name: input.name,
        mealType: input.mealType,
        items: input.items,
        servingMultiplier: 1,
    };
}
