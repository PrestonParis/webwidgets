import type { NutritionTotals } from '@/features/tracking/types/nutrition';
import type { FoodItem } from '@/features/tracking/types/nutritionFood';

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
