import type { NutritionTotals } from './nutritionTypes';
import type { FoodItem } from './foodTypes';

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
