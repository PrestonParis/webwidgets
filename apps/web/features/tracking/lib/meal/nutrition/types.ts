/**
 * Nutrition domain types.
 *
 * This is the canonical type layer for the expanded Meals/Nutrition product.
 * It is intentionally decoupled from React and from the raw TrackingEntry shape
 * so it can be reused by providers, analytics, import/export, and tests.
 *
 * Backward compatibility: the existing meal metadata fields
 * (calories, protein, carbs, fat, fiber, mealType, time, description, servings)
 * continue to work. New fields are additive and optional.
 */

import type { MealType } from '@/features/tracking/lib/meal/mealDomain';

export type { MealType };

// ─── micronutrients ─────────────────────────────────────────────────────────

/**
 * Optional micronutrient profile. No field is required — providers and entries
 * may supply any subset. All values are per the associated serving.
 */
export interface MicronutrientProfile {
    potassiumMg?: number;
    calciumMg?: number;
    ironMg?: number;
    vitaminDMcg?: number;
    vitaminCMg?: number;
    vitaminAMcg?: number;
    magnesiumMg?: number;
    cholesterolMg?: number;
    saturatedFatGrams?: number;
    transFatGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
}

/** Display metadata for a single micronutrient. */
export interface MicronutrientFieldMeta {
    key: keyof MicronutrientProfile;
    label: string;
    unit: string;
}

// ─── food provider results ──────────────────────────────────────────────────

/**
 * A normalized food result returned by any FoodProvider (search, barcode, db).
 * Always per a single serving (servingSize + servingUnit).
 */
export interface FoodSearchResult {
    externalId: string;
    provider: string;
    name: string;
    brand?: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    micronutrients?: Partial<MicronutrientProfile>;
    verified: boolean;
    rawMetadata?: Record<string, unknown>;
}

// ─── food item (component of meals & recipes) ───────────────────────────────

/**
 * A logged food item — a FoodSearchResult selection scaled by a quantity, or a
 * fully manual entry. Used inside meals (metadata.items) and recipes.
 */
export interface FoodItem {
    id: string;
    name: string;
    brand?: string;
    /** number of servings of the base food */
    quantity: number;
    servingSize: number;
    servingUnit: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    micronutrients?: Partial<MicronutrientProfile>;
    source: FoodSource;
    sourceProvider?: string;
    externalFoodId?: string;
    barcode?: string;
}

export type FoodSource =
    | 'manual'
    | 'search'
    | 'barcode'
    | 'recipe'
    | 'template'
    | 'import';

// ─── aggregate nutrition ────────────────────────────────────────────────────

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

// ─── recipes ────────────────────────────────────────────────────────────────

export interface RecipeRecord {
    id: string;
    name: string;
    servings: number;
    ingredients: FoodItem[];
    totalNutrition: NutritionTotals;
    perServingNutrition: NutritionTotals;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export type RecipeDraft = Omit<
    RecipeRecord,
    'id' | 'totalNutrition' | 'perServingNutrition' | 'createdAt' | 'updatedAt'
>;

// ─── saved meals / templates ────────────────────────────────────────────────

export interface SavedMealRecord {
    id: string;
    name: string;
    mealType: MealType;
    items: FoodItem[];
    nutrition: NutritionTotals;
    servingMultiplier: number;
    createdAt: string;
}

export type SavedMealDraft = Omit<
    SavedMealRecord,
    'id' | 'nutrition' | 'createdAt'
>;

// ─── goals ──────────────────────────────────────────────────────────────────

/**
 * Expanded nutrition goal configuration. All fields optional/null so partial
 * goals work. calorieMin/calorieMax express a range; calorieTarget is the
 * single-value form kept for backward compatibility with the existing widget.
 */
export interface NutritionGoalConfig {
    calorieTarget: number | null;
    calorieMin: number | null;
    calorieMax: number | null;
    proteinMin: number | null;
    carbsTarget: number | null;
    fatTarget: number | null;
    fiberMin: number | null;
    sodiumMax: number | null;
    mealsPerDay: number | null;
}

export interface GoalProgressItem {
    key: keyof NutritionGoalConfig;
    label: string;
    /** current value today */
    value: number;
    /** target value */
    target: number;
    unit: string;
    /** comparison direction */
    mode: 'min' | 'max' | 'target' | 'range';
    /** 0-100 clamped progress for display */
    pct: number;
    met: boolean;
    rangeMax?: number;
}

export interface GoalPreset {
    id: string;
    label: string;
    description: string;
    config: Partial<NutritionGoalConfig>;
}

// ─── import ─────────────────────────────────────────────────────────────────

export interface NutritionImportRow {
    rowIndex: number;
    date: string | null;
    mealType: MealType | null;
    name: string | null;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    fiberGrams: number | null;
    sugarGrams: number | null;
    sodiumMg: number | null;
    issues: string[];
    duplicate: boolean;
}

export interface NutritionImportPreview {
    detectedColumns: string[];
    detectedFormat: NutritionImportFormat;
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    errorRows: number;
    sample: NutritionImportRow[];
    rows: NutritionImportRow[];
}

export type NutritionImportFormat =
    | 'myfitnesspal'
    | 'cronometer'
    | 'generic'
    | 'unknown';

/** Existing-entry signature used for duplicate detection. */
export interface ExistingMealSignature {
    date: string;
    mealType: MealType | null;
    calories: number | null;
}
