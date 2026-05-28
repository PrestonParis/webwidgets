import type { NutritionTotals, MacroSplit } from './nutritionTypes';
import { round } from './helpers';

export function emptyTotals(): NutritionTotals {
    return {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
        sugarGrams: 0,
        sodiumMg: 0,
    };
}

/** Sum nutrition across food items. */
export function sumFoodItems(
    items: {
        calories: number;
        proteinGrams: number;
        carbsGrams: number;
        fatGrams: number;
        fiberGrams?: number;
        sugarGrams?: number;
        sodiumMg?: number;
    }[],
): NutritionTotals {
    const t = emptyTotals();
    for (const it of items) {
        t.calories += it.calories;
        t.proteinGrams += it.proteinGrams;
        t.carbsGrams += it.carbsGrams;
        t.fatGrams += it.fatGrams;
        t.fiberGrams += it.fiberGrams ?? 0;
        t.sugarGrams += it.sugarGrams ?? 0;
        t.sodiumMg += it.sodiumMg ?? 0;
    }
    return roundTotals(t);
}

/** Divide totals by a serving count (per-serving nutrition). */
export function divideTotals(
    totals: NutritionTotals,
    servings: number,
): NutritionTotals {
    const s = servings > 0 ? servings : 1;
    return roundTotals({
        calories: totals.calories / s,
        proteinGrams: totals.proteinGrams / s,
        carbsGrams: totals.carbsGrams / s,
        fatGrams: totals.fatGrams / s,
        fiberGrams: totals.fiberGrams / s,
        sugarGrams: totals.sugarGrams / s,
        sodiumMg: totals.sodiumMg / s,
    });
}

/** Scale totals by a multiplier (e.g. serving multiplier for saved meals). */
export function scaleTotals(
    totals: NutritionTotals,
    factor: number,
): NutritionTotals {
    const f = factor > 0 ? factor : 1;
    return roundTotals({
        calories: totals.calories * f,
        proteinGrams: totals.proteinGrams * f,
        carbsGrams: totals.carbsGrams * f,
        fatGrams: totals.fatGrams * f,
        fiberGrams: totals.fiberGrams * f,
        sugarGrams: totals.sugarGrams * f,
        sodiumMg: totals.sodiumMg * f,
    });
}

/**
 * Macro split as percentage of macro-derived calories.
 * Uses 4/4/9 kcal per gram for protein/carbs/fat. Returns zeros when there is
 * no macro data (avoids divide-by-zero).
 */
export function computeMacroSplit(totals: NutritionTotals): MacroSplit {
    const pCal = totals.proteinGrams * 4;
    const cCal = totals.carbsGrams * 4;
    const fCal = totals.fatGrams * 9;
    const denom = pCal + cCal + fCal;
    if (denom <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
    return {
        proteinPct: Math.round((pCal / denom) * 100),
        carbsPct: Math.round((cCal / denom) * 100),
        fatPct: Math.round((fCal / denom) * 100),
    };
}

function roundTotals(t: NutritionTotals): NutritionTotals {
    return {
        calories: Math.round(t.calories),
        proteinGrams: round(t.proteinGrams),
        carbsGrams: round(t.carbsGrams),
        fatGrams: round(t.fatGrams),
        fiberGrams: round(t.fiberGrams),
        sugarGrams: round(t.sugarGrams),
        sodiumMg: Math.round(t.sodiumMg),
    };
}
