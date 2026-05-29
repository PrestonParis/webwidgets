/**
 * Recipe nutrition calculation.
 *
 * Pure functions to compute total and per-serving nutrition for a recipe from
 * its ingredient FoodItems, and to turn a recipe into a loggable meal entry.
 */

import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { MealType } from '@/features/tracking/types/meal';
import { foodItemToMetadata } from '../foodItem';
import { sumFoodItems, divideTotals } from '../totals';
import type { FoodItem } from '@/features/tracking/types/nutritionFood';
import type { NutritionTotals } from '@/features/tracking/types/nutrition';
import type {
    RecipeDraft,
    RecipeRecord,
} from '@/features/tracking/types/nutritionRecipes';

/** Compute total + per-serving nutrition for a set of ingredients. */
export function computeRecipeNutrition(
    ingredients: FoodItem[],
    servings: number,
): { total: NutritionTotals; perServing: NutritionTotals } {
    const total = sumFoodItems(ingredients);
    const perServing = divideTotals(total, servings);
    return { total, perServing };
}

/** Materialize a full RecipeRecord from a draft. */
export function buildRecipeRecord(
    draft: RecipeDraft,
    opts: { id: string; now?: string },
): RecipeRecord {
    const now = opts.now ?? new Date().toISOString();
    const { total, perServing } = computeRecipeNutrition(
        draft.ingredients,
        draft.servings,
    );
    const record: RecipeRecord = {
        id: opts.id,
        name: draft.name,
        servings: draft.servings,
        ingredients: draft.ingredients,
        totalNutrition: total,
        perServingNutrition: perServing,
        createdAt: now,
        updatedAt: now,
    };
    if (draft.notes) record.notes = draft.notes;
    return record;
}

/** Recompute nutrition fields after editing an existing recipe. */
export function refreshRecipeNutrition(recipe: RecipeRecord): RecipeRecord {
    const { total, perServing } = computeRecipeNutrition(
        recipe.ingredients,
        recipe.servings,
    );
    return {
        ...recipe,
        totalNutrition: total,
        perServingNutrition: perServing,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Convert a recipe (one serving) into a meal entry payload.
 * The entry references the recipe via metadata.recipeId for traceability.
 */
export function recipeToMealEntry(
    recipe: RecipeRecord,
    opts: {
        date: string;
        mealType: MealType;
        servingsLogged?: number;
        time?: string;
    },
): BaseTrackingEntry {
    const servingsLogged = opts.servingsLogged ?? 1;
    const perServing = recipe.perServingNutrition;
    const factor = servingsLogged;

    const metadata: Record<string, unknown> = {
        mealType: opts.mealType,
        description: recipe.name,
        recipeId: recipe.id,
        servings: servingsLogged,
        source: 'recipe',
        calories: Math.round(perServing.calories * factor),
        protein: round(perServing.proteinGrams * factor),
        carbs: round(perServing.carbsGrams * factor),
        fat: round(perServing.fatGrams * factor),
        fiber: round(perServing.fiberGrams * factor),
        // Per-serving ingredient breakdown (scaled) for detail views.
        items: recipe.ingredients.map((ing) =>
            foodItemToMetadata(
                scaleItem(ing, servingsLogged / recipe.servings),
            ),
        ),
    };
    if (opts.time) metadata['time'] = opts.time;

    return {
        category: 'meal',
        entryDate: opts.date,
        metadata,
        tags: ['recipe'],
        source: 'manual',
    };
}

function scaleItem(item: FoodItem, factor: number): FoodItem {
    const f = factor > 0 ? factor : 1;
    const scaled: FoodItem = {
        ...item,
        quantity: round(item.quantity * f),
        calories: Math.round(item.calories * f),
        proteinGrams: round(item.proteinGrams * f),
        carbsGrams: round(item.carbsGrams * f),
        fatGrams: round(item.fatGrams * f),
    };
    if (item.fiberGrams !== undefined)
        scaled.fiberGrams = round(item.fiberGrams * f);
    if (item.sugarGrams !== undefined)
        scaled.sugarGrams = round(item.sugarGrams * f);
    if (item.sodiumMg !== undefined)
        scaled.sodiumMg = Math.round(item.sodiumMg * f);
    return scaled;
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}
