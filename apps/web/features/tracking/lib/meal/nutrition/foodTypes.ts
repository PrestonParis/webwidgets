import type { MicronutrientProfile } from './micronutrientTypes';

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
