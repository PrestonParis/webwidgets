/**
 * Recipe persistence.
 *
 * Recipes are stored in localStorage (per browser) to avoid a destructive DB
 * migration while the feature stabilizes. The interface (`RecipeStore`) is the
 * seam: a DB-backed implementation can replace `localRecipeStore` later without
 * touching components.
 */

import {
    buildRecipeRecord,
    refreshRecipeNutrition,
} from './providers/recipeProvider';
import type { RecipeDraft, RecipeRecord } from './recipeTypes';

const STORAGE_KEY = 'nutrition_recipes_v1';

export interface RecipeStore {
    list(): RecipeRecord[];
    get(id: string): RecipeRecord | null;
    create(draft: RecipeDraft): RecipeRecord;
    update(id: string, draft: RecipeDraft): RecipeRecord | null;
    remove(id: string): void;
}

function readAll(): RecipeRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as RecipeRecord[]) : [];
    } catch {
        return [];
    }
}

function writeAll(records: RecipeRecord[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
        console.error('[recipeStore] failed to persist recipes', err);
    }
}

function makeId(): string {
    return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const localRecipeStore: RecipeStore = {
    list() {
        return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    get(id) {
        return readAll().find((r) => r.id === id) ?? null;
    },
    create(draft) {
        const record = buildRecipeRecord(draft, { id: makeId() });
        const all = readAll();
        all.push(record);
        writeAll(all);
        return record;
    },
    update(id, draft) {
        const all = readAll();
        const idx = all.findIndex((r) => r.id === id);
        if (idx < 0) return null;
        const existing = all[idx]!;
        const updated = refreshRecipeNutrition({
            ...existing,
            name: draft.name,
            servings: draft.servings,
            ingredients: draft.ingredients,
            ...(draft.notes !== undefined ? { notes: draft.notes } : {}),
        });
        all[idx] = updated;
        writeAll(all);
        return updated;
    },
    remove(id) {
        writeAll(readAll().filter((r) => r.id !== id));
    },
};
