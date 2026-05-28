import type { MealType } from '@/features/tracking/lib/meal/types';
import type { NutritionTotals } from './nutritionTypes';
import type { FoodItem } from './foodTypes';

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
