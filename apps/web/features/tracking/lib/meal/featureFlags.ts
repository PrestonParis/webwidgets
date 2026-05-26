/**
 * Feature flags for the Meals/Nutrition product.
 *
 * These gate UI surfaces and provider behavior. Anything not yet fully wired
 * (e.g. photo logging / image analysis) is flagged off but the code path exists
 * so it can be enabled without a refactor.
 */

export const NUTRITION_FLAGS = {
    /** Text food search via FoodProvider registry (USDA / Open Food Facts). */
    foodSearch: true,
    /** Barcode lookup. UI shell always shows; live camera scan needs hardware. */
    barcodeScan: true,
    /** TODO: wire photoProvider when image analysis is available. */
    photoLogging: false,
    /** Recipe builder + logging. */
    recipes: true,
    /** Saved meals / templates. */
    savedMeals: true,
    /** CSV import (MyFitnessPal / Cronometer / generic). */
    imports: true,
    /** Micronutrient capture + display. */
    micronutrients: true,
    /** CSV export of meal history + daily summaries. */
    exports: true,
} as const;

export type NutritionFlag = keyof typeof NUTRITION_FLAGS;

export function isNutritionFeatureEnabled(flag: NutritionFlag): boolean {
    return NUTRITION_FLAGS[flag];
}
