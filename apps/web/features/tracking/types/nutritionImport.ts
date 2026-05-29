import type { MealType } from '@/features/tracking/types/meal';

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
