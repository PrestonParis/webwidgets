import type { MealType } from '@/features/tracking/lib/meal/types';
import type { MacroSplit } from './nutritionTypes';

export interface ExtendedNutritionAnalytics {
    todayTotals: DayTotals;
    sevenDayAvgCalories: number | null;
    sevenDayAvgProtein: number | null;
    thirtyDayAvgCalories: number | null;
    thirtyDayAvgProtein: number | null;
    caloriesTrend: Trend;
    proteinTrend: Trend;
    macroSplit7d: MacroSplit;
    goalHitRate7d: number | null;
    proteinHitRate7d: number | null;
    mealsPerDayAvg7d: number | null;
    mostFrequentFoods: { name: string; count: number }[];
    mostLoggedMealType: { type: MealType; count: number } | null;
    underProteinDays7d: number;
    skippedDays7d: number;
    daysWithData7d: number;
    totalDaysLogged: number;
}

export interface DayTotals {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    mealCount: number;
}

export type Trend = 'up' | 'down' | 'stable' | null;
