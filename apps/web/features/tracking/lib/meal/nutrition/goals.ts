/**
 * Nutrition goal configuration, presets, and progress calculations.
 *
 * Goals are persisted via the existing generic tracking-goals store
 * (category='meal', metricKey=<field>, targetValue=<number>). No schema change
 * is required: we simply use additional metricKey values beyond the original
 * 'calories' / 'protein'.
 *
 * Metric keys used:
 *   calories      -> calorieTarget (single value, legacy)
 *   calorieMin    -> calorie range minimum
 *   calorieMax    -> calorie range maximum
 *   protein       -> proteinMin (legacy)
 *   carbs         -> carbsTarget
 *   fat           -> fatTarget
 *   fiber         -> fiberMin
 *   sodium        -> sodiumMax
 *   mealsPerDay   -> mealsPerDay
 */

import type { DayTotals } from '@/features/tracking/types/nutritionAnalytics';
import type {
    GoalPreset,
    GoalProgressItem,
    NutritionGoalConfig,
} from '@/features/tracking/types/nutritionGoals';

export type MealGoalMetricKey =
    | 'calories'
    | 'calorieMin'
    | 'calorieMax'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'fiber'
    | 'sodium'
    | 'mealsPerDay';

interface RawGoal {
    category: string;
    targetType: string;
    metricKey?: string;
    targetValue: number;
}

export function emptyGoalConfig(): NutritionGoalConfig {
    return {
        calorieTarget: null,
        calorieMin: null,
        calorieMax: null,
        proteinMin: null,
        carbsTarget: null,
        fatTarget: null,
        fiberMin: null,
        sodiumMax: null,
        mealsPerDay: null,
    };
}

/** Build the full NutritionGoalConfig from raw goal rows. */
export function extractNutritionGoalConfig(
    goals: RawGoal[],
): NutritionGoalConfig {
    const meal = goals.filter((g) => g.category === 'meal');
    const find = (key: MealGoalMetricKey): number | null => {
        const g = meal.find((x) => x.metricKey === key);
        return g ? g.targetValue : null;
    };
    return {
        calorieTarget: find('calories'),
        calorieMin: find('calorieMin'),
        calorieMax: find('calorieMax'),
        proteinMin: find('protein'),
        carbsTarget: find('carbs'),
        fatTarget: find('fat'),
        fiberMin: find('fiber'),
        sodiumMax: find('sodium'),
        mealsPerDay:
            find('mealsPerDay') ??
            meal.find((g) => g.targetType === 'daily_log')?.targetValue ??
            null,
    };
}

export function hasAnyGoal(config: NutritionGoalConfig): boolean {
    return Object.values(config).some((v) => v !== null);
}

// ─── presets ────────────────────────────────────────────────────────────────

export const GOAL_PRESETS: GoalPreset[] = [
    {
        id: 'cutting',
        label: 'Cutting (1500 kcal)',
        description: 'Calorie deficit with high protein to preserve muscle.',
        config: {
            calorieTarget: 1500,
            proteinMin: 140,
            carbsTarget: 130,
            fatTarget: 50,
            fiberMin: 25,
            sodiumMax: 2300,
        },
    },
    {
        id: 'maintaining',
        label: 'Maintaining (2000 kcal)',
        description: 'Balanced intake to hold your current weight.',
        config: {
            calorieTarget: 2000,
            proteinMin: 120,
            carbsTarget: 220,
            fatTarget: 70,
            fiberMin: 30,
            sodiumMax: 2300,
        },
    },
    {
        id: 'bulking',
        label: 'Bulking (2500 kcal)',
        description: 'Calorie surplus to support muscle gain.',
        config: {
            calorieTarget: 2500,
            proteinMin: 160,
            carbsTarget: 300,
            fatTarget: 85,
            fiberMin: 35,
            sodiumMax: 2500,
        },
    },
    {
        id: 'custom',
        label: 'Custom',
        description: 'Set your own targets.',
        config: {},
    },
];

export function getPreset(id: string): GoalPreset | undefined {
    return GOAL_PRESETS.find((p) => p.id === id);
}

// ─── progress ───────────────────────────────────────────────────────────────

function clampPct(value: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
}

/**
 * Build display progress items for each active goal vs. today's totals.
 * Each item carries a `met` flag and a text-friendly pct (never color-only).
 */
export function computeGoalProgress(
    config: NutritionGoalConfig,
    today: DayTotals,
): GoalProgressItem[] {
    const items: GoalProgressItem[] = [];

    // Calorie range takes precedence over a single target if both min & max set.
    if (config.calorieMin !== null && config.calorieMax !== null) {
        items.push({
            key: 'calorieMax',
            label: 'Calories',
            value: today.calories,
            target: config.calorieMin,
            rangeMax: config.calorieMax,
            unit: 'kcal',
            mode: 'range',
            pct: clampPct(today.calories, config.calorieMax),
            met:
                today.calories >= config.calorieMin &&
                today.calories <= config.calorieMax,
        });
    } else if (config.calorieTarget !== null) {
        items.push({
            key: 'calorieTarget',
            label: 'Calories',
            value: today.calories,
            target: config.calorieTarget,
            unit: 'kcal',
            mode: 'max',
            pct: clampPct(today.calories, config.calorieTarget),
            met: today.calories > 0 && today.calories <= config.calorieTarget,
        });
    }

    if (config.proteinMin !== null) {
        items.push({
            key: 'proteinMin',
            label: 'Protein',
            value: today.proteinGrams,
            target: config.proteinMin,
            unit: 'g',
            mode: 'min',
            pct: clampPct(today.proteinGrams, config.proteinMin),
            met: today.proteinGrams >= config.proteinMin,
        });
    }

    if (config.carbsTarget !== null) {
        items.push({
            key: 'carbsTarget',
            label: 'Carbs',
            value: today.carbsGrams,
            target: config.carbsTarget,
            unit: 'g',
            mode: 'target',
            pct: clampPct(today.carbsGrams, config.carbsTarget),
            met: today.carbsGrams > 0 && today.carbsGrams <= config.carbsTarget,
        });
    }

    if (config.fatTarget !== null) {
        items.push({
            key: 'fatTarget',
            label: 'Fat',
            value: today.fatGrams,
            target: config.fatTarget,
            unit: 'g',
            mode: 'target',
            pct: clampPct(today.fatGrams, config.fatTarget),
            met: today.fatGrams > 0 && today.fatGrams <= config.fatTarget,
        });
    }

    if (config.fiberMin !== null) {
        items.push({
            key: 'fiberMin',
            label: 'Fiber',
            value: today.fiberGrams,
            target: config.fiberMin,
            unit: 'g',
            mode: 'min',
            pct: clampPct(today.fiberGrams, config.fiberMin),
            met: today.fiberGrams >= config.fiberMin,
        });
    }

    if (config.mealsPerDay !== null) {
        items.push({
            key: 'mealsPerDay',
            label: 'Meals',
            value: today.mealCount,
            target: config.mealsPerDay,
            unit: '',
            mode: 'min',
            pct: clampPct(today.mealCount, config.mealsPerDay),
            met: today.mealCount >= config.mealsPerDay,
        });
    }

    return items;
}

/** Human-readable status for a single progress item, for text equivalents. */
export function goalProgressLabel(item: GoalProgressItem): string {
    const v = Math.round(item.value);
    if (item.mode === 'range' && item.rangeMax !== undefined) {
        return `${v} / ${item.target}–${item.rangeMax}${item.unit} (${item.met ? 'in range' : 'out of range'})`;
    }
    const suffix = item.met ? 'met' : 'not met';
    if (item.mode === 'min') {
        return `${v} / ${item.target}${item.unit} minimum (${suffix})`;
    }
    if (item.mode === 'max') {
        return `${v} / ${item.target}${item.unit} limit (${suffix})`;
    }
    return `${v} / ${item.target}${item.unit} target (${suffix})`;
}
