import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export type MealViewMode = 'summary' | 'today' | 'history' | 'trends';

export interface MealRecord {
    id: string;
    date: string; // YYYY-MM-DD
    time: string | null; // HH:mm
    mealType: MealType | null;
    title: string | null;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    fiberGrams: number | null;
    servings: number | null;
    notes: string | null;
    source: string;
    raw: TrackingEntry;
}

export interface MealGoalConfig {
    /** Daily calorie target (kcal) */
    calorieTarget: number | null;
    /** Daily protein minimum (grams) */
    proteinMin: number | null;
    /** Target meals logged per day */
    mealsPerDay: number | null;
}

export interface DailyNutritionSummary {
    date: string;
    meals: MealRecord[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealCount: number;
    calorieGoalHit: boolean | null; // null = no goal
    proteinGoalHit: boolean | null;
}

export interface NutritionAnalytics {
    lastRecord: MealRecord | null;
    todaySummary: DailyNutritionSummary | null;
    sevenDayAvgCalories: number | null;
    sevenDayAvgProtein: number | null;
    goalCalorieHitRate7d: number | null; // 0-1
    goalProteinHitRate7d: number | null; // 0-1
    caloriesTrend: 'up' | 'down' | 'stable' | null;
    proteinTrend: 'up' | 'down' | 'stable' | null;
    totalRecords: number;
    mealsLoggedThisWeek: number;
    breakfastDaysThisWeek: number;
}
