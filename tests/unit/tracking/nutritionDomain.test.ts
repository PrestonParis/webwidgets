import { describe, expect, it } from 'vitest';
import { normalizeMealEntries } from '@/features/tracking/lib/meal/mealDomain';
import {
    computeMacroSplit,
    foodResultToMealMetadata,
    readFoodItems,
    sumFoodItems,
} from '@/features/tracking/lib/meal/nutrition/normalize';
import {
    computeExtendedAnalytics,
    dayTotals,
} from '@/features/tracking/lib/meal/nutrition/analytics';
import {
    computeGoalProgress,
    extractNutritionGoalConfig,
    goalProgressLabel,
} from '@/features/tracking/lib/meal/nutrition/goals';
import { makeManualResult } from '@/features/tracking/lib/meal/nutrition/providers/manualProvider';
import {
    dedupeResults,
    lookupBarcode,
} from '@/features/tracking/lib/meal/nutrition/providers';
import {
    buildRecipeRecord,
    recipeToMealEntry,
} from '@/features/tracking/lib/meal/nutrition/providers/recipeProvider';
import {
    buildImportPreview,
    importRowToEntry,
} from '@/features/tracking/lib/meal/nutrition/providers/importProvider';
import {
    buildMealHistoryCsv,
    buildDailySummaryCsv,
} from '@/features/tracking/lib/meal/nutrition/export';
import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { FoodItem } from '@/features/tracking/lib/meal/nutrition/types';

const entry = (overrides: Partial<TrackingEntry>): TrackingEntry => ({
    id: 'm1',
    userId: 'u1',
    category: 'meal',
    entryDate: '2026-05-18',
    loggedAt: '2026-05-18T12:00:00Z',
    metadata: {
        mealType: 'lunch',
        description: 'Chicken bowl',
        calories: 500,
        protein: 40,
        carbs: 55,
        fat: 14,
        fiber: 8,
    },
    tags: [],
    source: 'manual',
    createdAt: '2026-05-18T12:00:00Z',
    ...overrides,
});

const food: FoodItem = {
    id: 'food-1',
    name: 'Greek yogurt',
    quantity: 1,
    servingSize: 170,
    servingUnit: 'g',
    calories: 120,
    proteinGrams: 18,
    carbsGrams: 8,
    fatGrams: 0,
    fiberGrams: 0,
    sugarGrams: 6,
    sodiumMg: 70,
    source: 'manual',
};

describe('nutrition domain and providers', () => {
    it('normalizes meal entries newest first and reads structured food items', () => {
        const metadata = foodResultToMealMetadata(
            makeManualResult('Oats', {
                calories: 150,
                proteinGrams: 5,
                carbsGrams: 27,
                fatGrams: 3,
                micronutrients: { ironMg: 2, sodiumMg: 4 },
            }),
            { quantity: 2, mealType: 'breakfast', time: '08:00' },
        );
        const records = normalizeMealEntries([
            entry({ id: 'old', entryDate: '2026-05-17' }),
            entry({ id: 'new', entryDate: '2026-05-18', metadata }),
        ]);
        const items = readFoodItems(records[0]!.raw);

        expect(records[0]?.id).toBe('new');
        expect(records[0]?.calories).toBe(300);
        expect(items[0]?.name).toBe('Oats');
        expect(items[0]?.micronutrients?.ironMg).toBe(4);
    });

    it('calculates totals, macro split, daily totals, and analytics trends', () => {
        const records = normalizeMealEntries([
            entry({ id: 'a', entryDate: '2026-05-18' }),
            entry({
                id: 'b',
                entryDate: '2026-05-17',
                metadata: {
                    calories: 700,
                    protein: 60,
                    carbs: 60,
                    fat: 20,
                    mealType: 'dinner',
                    description: 'Chicken bowl',
                },
            }),
            entry({
                id: 'c',
                entryDate: '2026-05-10',
                metadata: {
                    calories: 300,
                    protein: 20,
                    carbs: 30,
                    fat: 8,
                    mealType: 'breakfast',
                    description: 'Toast',
                },
            }),
        ]);
        const analytics = computeExtendedAnalytics(
            records,
            {
                calorieTarget: 2000,
                calorieMin: null,
                calorieMax: null,
                proteinMin: 100,
                carbsTarget: null,
                fatTarget: null,
                fiberMin: null,
                sodiumMax: null,
                mealsPerDay: null,
            },
            new Date('2026-05-18T12:00:00Z'),
        );

        expect(
            sumFoodItems([food, { ...food, id: 'food-2' }]).proteinGrams,
        ).toBe(36);
        expect(
            computeMacroSplit({
                calories: 0,
                proteinGrams: 25,
                carbsGrams: 25,
                fatGrams: 0,
                fiberGrams: 0,
                sugarGrams: 0,
                sodiumMg: 0,
            }),
        ).toEqual({ proteinPct: 50, carbsPct: 50, fatPct: 0 });
        expect(dayTotals(records, '2026-05-18').calories).toBe(500);
        expect(analytics.sevenDayAvgCalories).toBe(600);
        expect(analytics.mostFrequentFoods[0]?.name).toBe('Chicken bowl');
    });

    it('extracts nutrition goals and builds text progress', () => {
        const goals = extractNutritionGoalConfig([
            {
                category: 'meal',
                targetType: 'daily_min',
                metricKey: 'calorieMin',
                targetValue: 1800,
            },
            {
                category: 'meal',
                targetType: 'daily_min',
                metricKey: 'calorieMax',
                targetValue: 2200,
            },
            {
                category: 'meal',
                targetType: 'daily_min',
                metricKey: 'protein',
                targetValue: 130,
            },
            { category: 'meal', targetType: 'daily_log', targetValue: 3 },
        ]);
        const progress = computeGoalProgress(goals, {
            calories: 2000,
            proteinGrams: 120,
            carbsGrams: 180,
            fatGrams: 70,
            fiberGrams: 20,
            mealCount: 2,
        });

        expect(goals.calorieMin).toBe(1800);
        expect(progress.find((item) => item.label === 'Calories')?.met).toBe(
            true,
        );
        expect(
            goalProgressLabel(
                progress.find((item) => item.label === 'Protein')!,
            ),
        ).toContain('not met');
    });

    it('dedupes provider results and handles barcode invalid state', async () => {
        const merged = dedupeResults([
            makeManualResult('Apple', { brand: 'Fresh', verified: false }),
            makeManualResult('Apple', {
                brand: 'Fresh',
                verified: true,
                provider: 'verified',
            }),
        ]);
        const barcode = await lookupBarcode('abc');

        expect(merged).toHaveLength(1);
        expect(merged[0]?.verified).toBe(true);
        expect(barcode.error?.code).toBe('invalid');
    });

    it('converts recipes to entries with recipe source metadata', () => {
        const recipe = buildRecipeRecord(
            {
                name: 'Yogurt bowl',
                servings: 2,
                ingredients: [
                    food,
                    {
                        ...food,
                        id: 'food-2',
                        name: 'Berries',
                        calories: 60,
                        proteinGrams: 1,
                        carbsGrams: 14,
                        fatGrams: 0,
                    },
                ],
            },
            { id: 'recipe-1', now: '2026-05-18T12:00:00Z' },
        );
        const meal = recipeToMealEntry(recipe, {
            date: '2026-05-18',
            mealType: 'breakfast',
            servingsLogged: 1,
        });

        expect(recipe.perServingNutrition.calories).toBe(90);
        expect(meal.metadata['recipeId']).toBe('recipe-1');
        expect(meal.metadata['source']).toBe('recipe');
    });

    it('previews nutrition CSV imports, detects duplicates, and exports CSV', () => {
        const preview = buildImportPreview(
            'Date,Meal,Food,Calories,Protein (g),Carbohydrates (g),Fat (g),Sodium (mg)\n05/18/2026,Lunch,Chicken,500,40,55,14,600\n05/18/2026,Lunch,Chicken,500,40,55,14,600',
        );
        const entryPayload = importRowToEntry(preview.rows[0]!);
        const records = normalizeMealEntries([
            entry({ metadata: entryPayload!.metadata }),
        ]);
        const historyCsv = buildMealHistoryCsv(records);
        const summaryCsv = buildDailySummaryCsv(records);

        expect(preview.validRows).toBe(1);
        expect(preview.duplicateRows).toBe(1);
        expect(entryPayload?.metadata['source']).toBe('import');
        expect(historyCsv).toContain('Chicken');
        expect(summaryCsv).toContain('2026-05-18');
    });
});
