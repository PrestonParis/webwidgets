import type {
    MealRecord,
    MealType,
    MealGoalConfig,
    NutritionAnalytics,
} from './types';

// ─── goal helpers ──────────────────────────────────────────────────────────────

/**
 * Extract meal-relevant goals from raw TrackingGoal records.
 * We store calorie goal as metricKey='calories' and protein goal as
 * metricKey='protein' (both with targetType='daily_min').
 */
export function extractMealGoalConfig(
    goals: {
        category: string;
        targetType: string;
        metricKey?: string;
        targetValue: number;
    }[],
): MealGoalConfig {
    const mealGoals = goals.filter((g) => g.category === 'meal');
    const calorieGoal = mealGoals.find((g) => g.metricKey === 'calories');
    const proteinGoal = mealGoals.find((g) => g.metricKey === 'protein');
    const mealsGoal = mealGoals.find(
        (g) => g.metricKey === 'mealsPerDay' || g.targetType === 'daily_log',
    );

    return {
        calorieTarget: calorieGoal?.targetValue ?? null,
        proteinMin: proteinGoal?.targetValue ?? null,
        mealsPerDay: mealsGoal?.targetValue ?? null,
    };
}

/** Today's calorie status relative to goal */
export function calorieStatus(
    todayCalories: number,
    calorieTarget: number | null,
): 'on_track' | 'under_target' | 'over_target' | 'no_goal' {
    if (calorieTarget === null) return 'no_goal';
    const ratio = todayCalories / calorieTarget;
    if (ratio > 1.1) return 'over_target';
    if (ratio < 0.6) return 'under_target';
    return 'on_track';
}

export function calorieStatusLabel(
    status: ReturnType<typeof calorieStatus>,
): string {
    switch (status) {
        case 'on_track':
            return 'On track';
        case 'under_target':
            return 'Under target';
        case 'over_target':
            return 'Over target';
        case 'no_goal':
            return 'No goal set';
    }
}

// ─── meal type helpers ─────────────────────────────────────────────────────────

export const MEAL_TYPE_ORDER: MealType[] = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'other',
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    other: 'Other',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
    other: '🍽️',
};

/** Group records by meal type, preserving MEAL_TYPE_ORDER */
export function groupByMealType(
    records: MealRecord[],
): Record<MealType, MealRecord[]> {
    const groups: Record<MealType, MealRecord[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        other: [],
    };
    for (const r of records) {
        const key = r.mealType ?? 'other';
        groups[key].push(r);
    }
    return groups;
}

// ─── formatting ────────────────────────────────────────────────────────────────

export function formatCalories(cal: number): string {
    return `${Math.round(cal)} kcal`;
}

export function formatMacro(grams: number, unit = 'g'): string {
    return `${Math.round(grams)}${unit}`;
}

export function mealRecordSummary(record: MealRecord): string {
    const parts: string[] = [];
    if (record.title) parts.push(record.title);
    if (record.calories !== null)
        parts.push(`${Math.round(record.calories)} kcal`);
    if (record.proteinGrams !== null)
        parts.push(`${Math.round(record.proteinGrams)}g protein`);
    return parts.length > 0 ? parts.join(' · ') : 'Meal';
}

export function formatMealTime(record: MealRecord): string {
    if (record.time) {
        // Convert HH:mm to 12h format
        const [h, m] = record.time.split(':');
        const hour = parseInt(h ?? '0', 10);
        const min = m ?? '00';
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour % 12 || 12;
        return `${display}:${min} ${ampm}`;
    }
    if (record.mealType) return MEAL_TYPE_LABELS[record.mealType];
    return '';
}

/** Nutrition insight strings — deterministic, no AI */
export function buildNutritionInsights(
    analytics: NutritionAnalytics,
    goals: MealGoalConfig,
): string[] {
    const insights: string[] = [];

    if (analytics.totalRecords === 0) {
        insights.push(
            'No meal data yet. Log your first meal to start tracking.',
        );
        return insights;
    }

    if (analytics.sevenDayAvgProtein !== null) {
        insights.push(
            `You're averaging ${Math.round(analytics.sevenDayAvgProtein)}g protein this week.`,
        );
    }

    if (analytics.sevenDayAvgCalories !== null) {
        const trend = analytics.caloriesTrend;
        if (trend === 'up')
            insights.push('Your calorie intake is trending up this week.');
        else if (trend === 'down')
            insights.push('Your calorie intake is trending down this week.');
    }

    if (analytics.breakfastDaysThisWeek > 0) {
        insights.push(
            `You logged breakfast ${analytics.breakfastDaysThisWeek} time${analytics.breakfastDaysThisWeek > 1 ? 's' : ''} this week.`,
        );
    }

    if (analytics.goalProteinHitRate7d !== null) {
        const rate = Math.round(analytics.goalProteinHitRate7d * 100);
        if (rate < 50 && goals.proteinMin !== null) {
            insights.push(
                `You usually miss your protein goal (${goals.proteinMin}g). Try to hit it on more days.`,
            );
        } else if (rate >= 80) {
            insights.push(
                `Great job — you hit your protein goal ${rate}% of days this week.`,
            );
        }
    }

    if (analytics.mealsLoggedThisWeek < 3) {
        insights.push('Log more meals to unlock trends and insights.');
    }

    return insights.slice(0, 3); // cap at 3
}
