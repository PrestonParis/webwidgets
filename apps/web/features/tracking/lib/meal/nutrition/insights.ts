/**
 * Deterministic, local nutrition insights (no AI / no network).
 *
 * Built from ExtendedNutritionAnalytics so they stay consistent with the charts.
 * Always returns at least one string; falls back to a "not enough data" message.
 */

import { MEAL_TYPE_LABELS } from '@/features/tracking/lib/meal/helpers';
import type { ExtendedNutritionAnalytics } from './analytics';
import type { NutritionGoalConfig } from './goalTypes';

export function buildExtendedInsights(
    analytics: ExtendedNutritionAnalytics,
    goals: NutritionGoalConfig,
): string[] {
    const out: string[] = [];

    if (analytics.totalDaysLogged === 0) {
        return ['Not enough data for this insight yet. Log a meal to begin.'];
    }

    if (analytics.sevenDayAvgProtein !== null) {
        out.push(
            `You are averaging ${Math.round(analytics.sevenDayAvgProtein)}g protein this week.`,
        );
    }

    if (analytics.goalHitRate7d !== null && goals) {
        const hits = Math.round(
            analytics.goalHitRate7d * analytics.daysWithData7d,
        );
        out.push(
            `You hit your calorie range ${hits} of the last ${analytics.daysWithData7d} logged day${analytics.daysWithData7d === 1 ? '' : 's'}.`,
        );
    }

    if (analytics.mostLoggedMealType) {
        const label =
            MEAL_TYPE_LABELS[analytics.mostLoggedMealType.type] ??
            analytics.mostLoggedMealType.type;
        out.push(`Your most logged meal type is ${label.toLowerCase()}.`);
    }

    if (analytics.caloriesTrend === 'up') {
        out.push('Your calorie intake is trending up versus last week.');
    } else if (analytics.caloriesTrend === 'down') {
        out.push('Your calorie intake is trending down versus last week.');
    }

    if (goals.proteinMin !== null && analytics.underProteinDays7d > 0) {
        out.push(
            `You fell short of your protein goal on ${analytics.underProteinDays7d} day${analytics.underProteinDays7d === 1 ? '' : 's'} this week.`,
        );
    }

    if (analytics.skippedDays7d >= 3) {
        out.push(
            `You logged nothing on ${analytics.skippedDays7d} of the last 7 days.`,
        );
    }

    if (analytics.mostFrequentFoods.length > 0) {
        const top = analytics.mostFrequentFoods[0]!;
        out.push(
            `"${top.name}" is your most logged food (${top.count} times).`,
        );
    }

    if (out.length === 0) {
        out.push('Not enough data for this insight yet.');
    }

    return out.slice(0, 5);
}
