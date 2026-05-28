import type {
    MealRecord,
    DailyNutritionSummary,
    NutritionAnalytics,
} from './types';

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

function calculatePerDayValues(
    records: MealRecord[],
    dates: string[],
    field: 'calories' | 'proteinGrams',
): number[] {
    return dates.map((d) =>
        sum(records.filter((r) => r.date === d).map((r) => r[field])),
    );
}

function calculateTrend(
    currentValues: number[],
    priorValues: number[],
    threshold: number,
): 'up' | 'down' | 'stable' | null {
    const curr = avg(currentValues.filter((v) => v > 0));
    const prev = avg(priorValues.filter((v) => v > 0));
    if (curr === null || prev === null) return null;
    if (curr - prev > threshold) return 'up';
    if (prev - curr > threshold) return 'down';
    return 'stable';
}

function calculateGoalHitRate(
    dates: string[],
    records: MealRecord[],
    goal: number | null,
    field: 'calories' | 'proteinGrams',
    comparison: (value: number, goal: number) => boolean,
): number | null {
    if (!goal || dates.length === 0) return null;
    const hits = dates.filter((d) => {
        const value = sum(
            records.filter((r) => r.date === d).map((r) => r[field]),
        );
        return value > 0 && comparison(value, goal);
    }).length;
    return hits / dates.length;
}

export function computeMealAnalytics(
    records: MealRecord[],
    goals: { calorieTarget: number | null; proteinMin: number | null },
): NutritionAnalytics {
    const today = dayKey(0);
    const sevenAgo = dayKey(-7);
    const fourteenAgo = dayKey(-14);
    const startOfWeek = dayKey(-6);

    const last7Dates = datesWithMeals(records, sevenAgo, today);
    const prior7Dates = datesWithMeals(records, fourteenAgo, dayKey(-8));

    const last7CaloriesPerDay = calculatePerDayValues(
        records,
        last7Dates,
        'calories',
    );
    const last7ProteinPerDay = calculatePerDayValues(
        records,
        last7Dates,
        'proteinGrams',
    );
    const prior7CaloriesPerDay = calculatePerDayValues(
        records,
        prior7Dates,
        'calories',
    );
    const prior7ProteinPerDay = calculatePerDayValues(
        records,
        prior7Dates,
        'proteinGrams',
    );

    const sevenDayAvgCalories = avg(last7CaloriesPerDay.filter((v) => v > 0));
    const sevenDayAvgProtein = avg(last7ProteinPerDay.filter((v) => v > 0));

    const caloriesTrend = calculateTrend(
        last7CaloriesPerDay,
        prior7CaloriesPerDay,
        50,
    );
    const proteinTrend = calculateTrend(
        last7ProteinPerDay,
        prior7ProteinPerDay,
        5,
    );

    const goalCalorieHitRate7d = calculateGoalHitRate(
        last7Dates,
        records,
        goals.calorieTarget,
        'calories',
        (value, goal) => value <= goal,
    );

    const goalProteinHitRate7d = calculateGoalHitRate(
        last7Dates,
        records,
        goals.proteinMin,
        'proteinGrams',
        (value, goal) => value >= goal,
    );

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

    const weekMeals = records.filter(
        (r) => r.date >= startOfWeek && r.date <= today,
    );
    const mealsLoggedThisWeek = weekMeals.length;

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
