import type { TrackingEntry } from '@/features/tracking/types/tracking';

// ─── domain types ─────────────────────────────────────────────────────────────

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

// ─── normalization ─────────────────────────────────────────────────────────────

export function normalizeMealEntry(entry: TrackingEntry): MealRecord {
    const m = entry.metadata;

    const time = typeof m['time'] === 'string' ? m['time'] : null;
    const mealType = isMealType(m['mealType']) ? m['mealType'] : null;
    const title =
        typeof m['description'] === 'string' && m['description']
            ? m['description']
            : null;
    const calories =
        typeof m['calories'] === 'number' && m['calories'] >= 0
            ? m['calories']
            : null;
    const proteinGrams =
        typeof m['protein'] === 'number' && m['protein'] >= 0
            ? m['protein']
            : null;
    const carbsGrams =
        typeof m['carbs'] === 'number' && m['carbs'] >= 0 ? m['carbs'] : null;
    const fatGrams =
        typeof m['fat'] === 'number' && m['fat'] >= 0 ? m['fat'] : null;
    const fiberGrams =
        typeof m['fiber'] === 'number' && m['fiber'] >= 0 ? m['fiber'] : null;
    const servings =
        typeof m['servings'] === 'number' && m['servings'] > 0
            ? m['servings']
            : null;

    return {
        id: entry.id,
        date: entry.entryDate,
        time,
        mealType,
        title,
        calories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        fiberGrams,
        servings,
        notes: entry.notes ?? null,
        source: entry.source,
        raw: entry,
    };
}

/** Returns meal records sorted newest-first. */
export function normalizeMealEntries(entries: TrackingEntry[]): MealRecord[] {
    return entries
        .filter((e) => e.category === 'meal')
        .map(normalizeMealEntry)
        .sort((a, b) => {
            const dateDiff = b.date.localeCompare(a.date);
            if (dateDiff !== 0) return dateDiff;
            // Secondary sort by time within same date (newest first)
            if (a.time && b.time) return b.time.localeCompare(a.time);
            return 0;
        });
}

// ─── daily summary ─────────────────────────────────────────────────────────────

export function buildDailySummary(
    date: string,
    records: MealRecord[],
    calorieGoal: number | null,
    proteinGoal: number | null,
): DailyNutritionSummary {
    const dayMeals = records.filter((r) => r.date === date);
    const totalCalories = sum(dayMeals.map((r) => r.calories));
    const totalProtein = sum(dayMeals.map((r) => r.proteinGrams));
    const totalCarbs = sum(dayMeals.map((r) => r.carbsGrams));
    const totalFat = sum(dayMeals.map((r) => r.fatGrams));

    return {
        date,
        meals: dayMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        mealCount: dayMeals.length,
        calorieGoalHit:
            calorieGoal !== null
                ? totalCalories > 0 && totalCalories <= calorieGoal
                : null,
        proteinGoalHit:
            proteinGoal !== null ? totalProtein >= proteinGoal : null,
    };
}

// ─── analytics ────────────────────────────────────────────────────────────────

function dayKey(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

function sum(values: (number | null)[]): number {
    return values.reduce<number>((acc, v) => (v !== null ? acc + v : acc), 0);
}

function avg(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Get unique dates in a range that have at least one meal logged */
function datesWithMeals(
    records: MealRecord[],
    from: string,
    to: string,
): string[] {
    const dates = new Set<string>();
    for (const r of records) {
        if (r.date >= from && r.date <= to) dates.add(r.date);
    }
    return Array.from(dates);
}

export function computeMealAnalytics(
    records: MealRecord[],
    goals: { calorieTarget: number | null; proteinMin: number | null },
): NutritionAnalytics {
    const today = dayKey(0);
    const sevenAgo = dayKey(-7);
    const fourteenAgo = dayKey(-14);
    const startOfWeek = dayKey(-6); // 7-day rolling window including today

    const last7Dates = datesWithMeals(records, sevenAgo, today);
    const prior7Dates = datesWithMeals(records, fourteenAgo, dayKey(-8));

    // Per-day calorie/protein averages
    const last7CaloriesPerDay = last7Dates.map((d) =>
        sum(records.filter((r) => r.date === d).map((r) => r.calories)),
    );
    const last7ProteinPerDay = last7Dates.map((d) =>
        sum(records.filter((r) => r.date === d).map((r) => r.proteinGrams)),
    );
    const prior7CaloriesPerDay = prior7Dates.map((d) =>
        sum(records.filter((r) => r.date === d).map((r) => r.calories)),
    );
    const prior7ProteinPerDay = prior7Dates.map((d) =>
        sum(records.filter((r) => r.date === d).map((r) => r.proteinGrams)),
    );

    const sevenDayAvgCalories = avg(last7CaloriesPerDay.filter((v) => v > 0));
    const sevenDayAvgProtein = avg(last7ProteinPerDay.filter((v) => v > 0));

    // Calorie trend
    const caloriesTrend = ((): 'up' | 'down' | 'stable' | null => {
        const curr = avg(last7CaloriesPerDay.filter((v) => v > 0));
        const prev = avg(prior7CaloriesPerDay.filter((v) => v > 0));
        if (curr === null || prev === null) return null;
        if (curr - prev > 50) return 'up';
        if (prev - curr > 50) return 'down';
        return 'stable';
    })();

    const proteinTrend = ((): 'up' | 'down' | 'stable' | null => {
        const curr = avg(last7ProteinPerDay.filter((v) => v > 0));
        const prev = avg(prior7ProteinPerDay.filter((v) => v > 0));
        if (curr === null || prev === null) return null;
        if (curr - prev > 5) return 'up';
        if (prev - curr > 5) return 'down';
        return 'stable';
    })();

    // Goal hit rates
    const goalCalorieHitRate7d = (() => {
        if (!goals.calorieTarget || last7Dates.length === 0) return null;
        const hits = last7Dates.filter((d) => {
            const cal = sum(
                records.filter((r) => r.date === d).map((r) => r.calories),
            );
            return cal > 0 && cal <= goals.calorieTarget!;
        }).length;
        return hits / last7Dates.length;
    })();

    const goalProteinHitRate7d = (() => {
        if (!goals.proteinMin || last7Dates.length === 0) return null;
        const hits = last7Dates.filter((d) => {
            const protein = sum(
                records.filter((r) => r.date === d).map((r) => r.proteinGrams),
            );
            return protein >= goals.proteinMin!;
        }).length;
        return hits / last7Dates.length;
    })();

    // Today summary
    const todayMeals = records.filter((r) => r.date === today);
    const todaySummary: DailyNutritionSummary | null =
        todayMeals.length > 0
            ? buildDailySummary(
                  today,
                  records,
                  goals.calorieTarget,
                  goals.proteinMin,
              )
            : null;

    // Meals logged this week
    const weekMeals = records.filter(
        (r) => r.date >= startOfWeek && r.date <= today,
    );
    const mealsLoggedThisWeek = weekMeals.length;

    // Breakfast days this week
    const breakfastDaysThisWeek = new Set(
        weekMeals.filter((r) => r.mealType === 'breakfast').map((r) => r.date),
    ).size;

    return {
        lastRecord: records[0] ?? null,
        todaySummary,
        sevenDayAvgCalories,
        sevenDayAvgProtein,
        goalCalorieHitRate7d,
        goalProteinHitRate7d,
        caloriesTrend,
        proteinTrend,
        totalRecords: records.length,
        mealsLoggedThisWeek,
        breakfastDaysThisWeek,
    };
}

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

function isMealType(value: unknown): value is MealType {
    return (
        typeof value === 'string' &&
        ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(value)
    );
}

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
