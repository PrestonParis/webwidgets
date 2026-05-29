/**
 * Extended nutrition analytics.
 *
 * Operates on the existing MealRecord[] (from mealDomain.normalizeMealEntries)
 * so it composes with current data without re-fetching. All calculations are
 * pure and deterministic — safe to unit test and to call from render via useMemo.
 */

import type { MealRecord, MealType } from '@/features/tracking/types/meal';
import type { NutritionGoalConfig } from '@/features/tracking/types/nutritionGoals';
import type { MacroSplit } from '@/features/tracking/types/nutrition';
import type {
    DayTotals,
    ExtendedNutritionAnalytics,
    Trend,
} from '@/features/tracking/types/nutritionAnalytics';

// ─── date helpers ───────────────────────────────────────────────────────────

function dayKey(offsetDays = 0, base = new Date()): string {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

/** All YYYY-MM-DD strings in [from, to] inclusive. */
function dateRange(from: string, to: string): string[] {
    const out: string[] = [];
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

function sumField(
    records: MealRecord[],
    field:
        | 'calories'
        | 'proteinGrams'
        | 'carbsGrams'
        | 'fatGrams'
        | 'fiberGrams',
): number {
    return records.reduce((acc, r) => acc + (r[field] ?? 0), 0);
}

function avg(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── per-day totals ─────────────────────────────────────────────────────────

export function dayTotals(records: MealRecord[], date: string): DayTotals {
    const day = records.filter((r) => r.date === date);
    return {
        calories: sumField(day, 'calories'),
        proteinGrams: sumField(day, 'proteinGrams'),
        carbsGrams: sumField(day, 'carbsGrams'),
        fatGrams: sumField(day, 'fatGrams'),
        fiberGrams: sumField(day, 'fiberGrams'),
        mealCount: day.length,
    };
}

// ─── main analytics ─────────────────────────────────────────────────────────

function calculatePerDayNutrients(
    records: MealRecord[],
    dates: string[],
    field: 'calories' | 'proteinGrams',
): number[] {
    return dates
        .map((d) =>
            sumField(
                records.filter((r) => r.date === d),
                field,
            ),
        )
        .filter((v) => v > 0);
}

function calculateGoalHitRates(
    daysWithData: string[],
    records: MealRecord[],
    goals: NutritionGoalConfig,
): { goalHitRate7d: number | null; proteinHitRate7d: number | null } {
    const goalHitRate7d = rate(daysWithData, (d) => {
        if (!goals.calorieTarget && !goals.calorieMax) return null;
        const cal = sumField(
            records.filter((r) => r.date === d),
            'calories',
        );
        if (cal <= 0) return null;
        const max = goals.calorieMax ?? goals.calorieTarget!;
        const min = goals.calorieMin ?? 0;
        return cal >= min && cal <= max;
    });
    const proteinHitRate7d = rate(daysWithData, (d) => {
        if (!goals.proteinMin) return null;
        const pro = sumField(
            records.filter((r) => r.date === d),
            'proteinGrams',
        );
        if (pro <= 0) return null;
        return pro >= goals.proteinMin;
    });
    return { goalHitRate7d, proteinHitRate7d };
}

function calculateUnderProteinDays(
    daysWithData: string[],
    records: MealRecord[],
    proteinMin: number | null,
): number {
    if (!proteinMin) return 0;
    return daysWithData.filter((d) => {
        const pro = sumField(
            records.filter((r) => r.date === d),
            'proteinGrams',
        );
        return pro > 0 && pro < proteinMin;
    }).length;
}

function calculateMealsPerDayAvg(
    daysWithData: string[],
    records: MealRecord[],
): number | null {
    if (daysWithData.length === 0) return null;
    return avg(
        daysWithData.map((d) => records.filter((r) => r.date === d).length),
    );
}

export function computeExtendedAnalytics(
    records: MealRecord[],
    goals: NutritionGoalConfig,
    now = new Date(),
): ExtendedNutritionAnalytics {
    const today = dayKey(0, now);
    const last7 = dateRange(dayKey(-6, now), today);
    const prior7 = dateRange(dayKey(-13, now), dayKey(-7, now));
    const last30 = dateRange(dayKey(-29, now), today);

    const last7Cal = calculatePerDayNutrients(records, last7, 'calories');
    const last7Pro = calculatePerDayNutrients(records, last7, 'proteinGrams');
    const prior7Cal = calculatePerDayNutrients(records, prior7, 'calories');
    const prior7Pro = calculatePerDayNutrients(records, prior7, 'proteinGrams');

    const sevenDayAvgCalories = avg(last7Cal);
    const sevenDayAvgProtein = avg(last7Pro);
    const thirtyDayAvgCalories = avg(
        calculatePerDayNutrients(records, last30, 'calories'),
    );
    const thirtyDayAvgProtein = avg(
        calculatePerDayNutrients(records, last30, 'proteinGrams'),
    );

    const caloriesTrend = trend(avg(last7Cal), avg(prior7Cal), 50);
    const proteinTrend = trend(avg(last7Pro), avg(prior7Pro), 5);

    const last7Records = records.filter(
        (r) => r.date >= last7[0]! && r.date <= today,
    );
    const macroSplit7d = computeMacroSplitFromRecords(last7Records);

    const daysWithData = last7.filter((d) => records.some((r) => r.date === d));
    const daysWithData7d = daysWithData.length;
    const skippedDays7d = last7.length - daysWithData7d;

    const { goalHitRate7d, proteinHitRate7d } = calculateGoalHitRates(
        daysWithData,
        records,
        goals,
    );

    const underProteinDays7d = calculateUnderProteinDays(
        daysWithData,
        records,
        goals.proteinMin,
    );

    const mealsPerDayAvg7d = calculateMealsPerDayAvg(daysWithData, records);

    const mostFrequentFoods = topFoods(records, 5);
    const mostLoggedMealType = topMealType(records);
    const totalDaysLogged = new Set(records.map((r) => r.date)).size;

    return {
        todayTotals: dayTotals(records, today),
        sevenDayAvgCalories,
        sevenDayAvgProtein,
        thirtyDayAvgCalories,
        thirtyDayAvgProtein,
        caloriesTrend,
        proteinTrend,
        macroSplit7d,
        goalHitRate7d,
        proteinHitRate7d,
        mealsPerDayAvg7d,
        mostFrequentFoods,
        mostLoggedMealType,
        underProteinDays7d,
        skippedDays7d,
        daysWithData7d,
        totalDaysLogged,
    };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function trend(
    curr: number | null,
    prev: number | null,
    threshold: number,
): Trend {
    if (curr === null || prev === null) return null;
    if (curr - prev > threshold) return 'up';
    if (prev - curr > threshold) return 'down';
    return 'stable';
}

/** Fraction of days where predicate returns true; null when no eligible days. */
function rate(
    days: string[],
    predicate: (d: string) => boolean | null,
): number | null {
    const evaluated = days
        .map(predicate)
        .filter((v): v is boolean => v !== null);
    if (evaluated.length === 0) return null;
    const hits = evaluated.filter(Boolean).length;
    return hits / evaluated.length;
}

export function computeMacroSplitFromRecords(
    records: MealRecord[],
): MacroSplit {
    const p = sumField(records, 'proteinGrams') * 4;
    const c = sumField(records, 'carbsGrams') * 4;
    const f = sumField(records, 'fatGrams') * 9;
    const denom = p + c + f;
    if (denom <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
    return {
        proteinPct: Math.round((p / denom) * 100),
        carbsPct: Math.round((c / denom) * 100),
        fatPct: Math.round((f / denom) * 100),
    };
}

function topFoods(
    records: MealRecord[],
    limit: number,
): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const r of records) {
        const name = r.title?.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .filter((f) => f.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function topMealType(
    records: MealRecord[],
): { type: MealType; count: number } | null {
    const counts = new Map<MealType, number>();
    for (const r of records) {
        if (!r.mealType) continue;
        counts.set(r.mealType, (counts.get(r.mealType) ?? 0) + 1);
    }
    let best: { type: MealType; count: number } | null = null;
    for (const [type, count] of counts.entries()) {
        if (!best || count > best.count) best = { type, count };
    }
    return best;
}
