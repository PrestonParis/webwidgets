/**
 * Extended nutrition analytics.
 *
 * Operates on the existing MealRecord[] (from mealDomain.normalizeMealEntries)
 * so it composes with current data without re-fetching. All calculations are
 * pure and deterministic — safe to unit test and to call from render via useMemo.
 */

import type {
    MealRecord,
    MealType,
} from '@/features/tracking/lib/meal/mealDomain';
import type { MacroSplit, NutritionGoalConfig } from './types';

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

export function computeExtendedAnalytics(
    records: MealRecord[],
    goals: NutritionGoalConfig,
    now = new Date(),
): ExtendedNutritionAnalytics {
    const today = dayKey(0, now);
    const last7 = dateRange(dayKey(-6, now), today);
    const prior7 = dateRange(dayKey(-13, now), dayKey(-7, now));
    const last30 = dateRange(dayKey(-29, now), today);

    const perDayCalories = (dates: string[]): number[] =>
        dates
            .map((d) =>
                sumField(
                    records.filter((r) => r.date === d),
                    'calories',
                ),
            )
            .filter((v) => v > 0);
    const perDayProtein = (dates: string[]): number[] =>
        dates
            .map((d) =>
                sumField(
                    records.filter((r) => r.date === d),
                    'proteinGrams',
                ),
            )
            .filter((v) => v > 0);

    const last7Cal = perDayCalories(last7);
    const last7Pro = perDayProtein(last7);
    const prior7Cal = perDayCalories(prior7);
    const prior7Pro = perDayProtein(prior7);

    const sevenDayAvgCalories = avg(last7Cal);
    const sevenDayAvgProtein = avg(last7Pro);
    const thirtyDayAvgCalories = avg(perDayCalories(last30));
    const thirtyDayAvgProtein = avg(perDayProtein(last30));

    const caloriesTrend = trend(avg(last7Cal), avg(prior7Cal), 50);
    const proteinTrend = trend(avg(last7Pro), avg(prior7Pro), 5);

    // 7-day macro split
    const last7Records = records.filter(
        (r) => r.date >= last7[0]! && r.date <= today,
    );
    const macroSplit7d = computeMacroSplitFromRecords(last7Records);

    // days with any data
    const daysWithData = last7.filter((d) => records.some((r) => r.date === d));
    const daysWithData7d = daysWithData.length;
    const skippedDays7d = last7.length - daysWithData7d;

    // goal hit rates over days-with-data
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

    const underProteinDays7d = goals.proteinMin
        ? daysWithData.filter((d) => {
              const pro = sumField(
                  records.filter((r) => r.date === d),
                  'proteinGrams',
              );
              return pro > 0 && pro < goals.proteinMin!;
          }).length
        : 0;

    // meals per day average (over days with data)
    const mealsPerDayAvg7d =
        daysWithData7d > 0
            ? avg(
                  daysWithData.map(
                      (d) => records.filter((r) => r.date === d).length,
                  ),
              )
            : null;

    // most frequent foods (by title)
    const mostFrequentFoods = topFoods(records, 5);

    // most logged meal type (all-time)
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
