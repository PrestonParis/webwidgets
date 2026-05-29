import type { MealType } from '@/features/tracking/types/meal';
import type { NutritionTotals } from '@/features/tracking/types/nutrition';
import type { FoodItem } from '@/features/tracking/types/nutritionFood';

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
