/** Summed nutrition across a set of food items / meals. */
export interface NutritionTotals {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    sugarGrams: number;
    sodiumMg: number;
}

/** Macro split as percentages of total macro-derived calories. */
export interface MacroSplit {
    /** 0-100 */
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
}
