import { calcCategoryStats } from '@/features/tracking/lib/analyticsEngine';
import { findCorrelations } from '@/features/tracking/lib/correlationEngine';
import {
    getAllTrackingCategoryConfigs,
    getTrackingCategoryConfig,
} from '@/features/tracking/lib/categoryConfig';
import { summarizeCategoryMetrics } from '@/features/tracking/lib/metricRenderer';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { Correlation } from '@/features/tracking/types/analytics';
import type { TrackingEntry } from '@/features/tracking/types/tracking';

export type TrackingInsight = {
    label: string;
    confidence: number;
    reason: string;
    category?: string;
    actionType?:
        | 'log_today'
        | 'review_correlation'
        | 'set_goal'
        | 'inspect_drop'
        | 'automation_candidate';
};

export function buildTrackingOverview(
    entries: TrackingEntry[],
    customDefs: CustomCategoryDef[] = [],
) {
    const configs = getAllTrackingCategoryConfigs(customDefs);
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .slice(0, 10);
    const entriesToday = entries.filter((entry) => entry.entryDate === today);
    const entriesThisWeek = entries.filter(
        (entry) => entry.entryDate >= weekAgo,
    );
    const activeCategories = new Set(entries.map((entry) => entry.category));
    const categoryStats = configs.map((config) =>
        calcCategoryStats(entries, config.id),
    );
    const bestStreak = [...categoryStats].sort(
        (a, b) => b.currentStreak - a.currentStreak,
    )[0];
    const coverage =
        configs.length > 0 ? activeCategories.size / configs.length : 0;

    return {
        totalEntries: entries.length,
        entriesToday: entriesToday.length,
        entriesThisWeek: entriesThisWeek.length,
        activeCategoryCount: activeCategories.size,
        coverage,
        bestStreak,
        categoryStats,
    };
}

export function generateTrackingInsights(
    entries: TrackingEntry[],
    customDefs: CustomCategoryDef[] = [],
): TrackingInsight[] {
    const overview = buildTrackingOverview(entries, customDefs);
    const configs = getAllTrackingCategoryConfigs(customDefs);
    const insights: TrackingInsight[] = [];
    const correlations = findCorrelations(entries, {
        crossCategoryCorrelations: true,
        aiAnalysis: false,
        externalDataImport: false,
    });
    const strongestCorrelation = correlations.sort(
        (a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient),
    )[0];

    if (overview.entriesToday === 0) {
        insights.push({
            label: 'No signal today',
            confidence: 0.95,
            reason: 'Nothing has been logged today, so streaks and predictions will decay.',
            actionType: 'log_today',
        });
    }

    if (overview.bestStreak && overview.bestStreak.currentStreak >= 3) {
        const config = getTrackingCategoryConfig(
            overview.bestStreak.category,
            customDefs,
        );
        insights.push({
            label: 'Streak momentum',
            confidence: 0.88,
            reason: `${config.label} has a ${overview.bestStreak.currentStreak}-day streak.`,
            category: config.id,
        });
    }

    if (strongestCorrelation) {
        insights.push({
            label: 'Correlation candidate',
            confidence: Math.min(
                0.9,
                Math.abs(strongestCorrelation.coefficient),
            ),
            reason: describeCorrelation(strongestCorrelation, customDefs),
            actionType: 'review_correlation',
        });
    }

    for (const config of configs) {
        const summaries = summarizeCategoryMetrics(
            entries,
            config.id,
            customDefs,
        );
        for (const summary of summaries.slice(0, 1)) {
            if (summary.count < 3) continue;
            const delta = summary.latest - summary.avg;
            if (Math.abs(delta) < Math.max(0.5, Math.abs(summary.avg) * 0.15))
                continue;
            insights.push({
                label: `${config.label} shift`,
                confidence: 0.62,
                reason: `${summary.metric.label} is ${delta > 0 ? 'above' : 'below'} its recent average.`,
                category: config.id,
                actionType: 'inspect_drop',
            });
        }
    }

    if (overview.coverage < 0.4 && entries.length > 5) {
        insights.push({
            label: 'Low coverage',
            confidence: 0.7,
            reason: 'Most configured life areas have no recent data. Add one complementary metric to improve correlations.',
            actionType: 'set_goal',
        });
    }

    insights.push(
        ...configs
            .filter((config) => config.supports.includes('automation'))
            .slice(0, 2)
            .map((config) => ({
                label: 'Automation-ready',
                confidence: 0.55,
                reason: `${config.label} exposes triggers like ${config.automationEvents?.[0] ?? `${config.id}_changed`}.`,
                category: config.id,
                actionType: 'automation_candidate' as const,
            })),
    );

    return insights.slice(0, 8);
}

export function suggestAutomationTriggers(
    entries: TrackingEntry[],
    customDefs: CustomCategoryDef[] = [],
): TrackingInsight[] {
    return getAllTrackingCategoryConfigs(customDefs)
        .filter((config) => config.supports.includes('automation'))
        .map((config) => {
            const stats = calcCategoryStats(entries, config.id);
            return {
                label:
                    config.automationEvents?.[0] ?? `${config.label} trigger`,
                confidence: stats.count > 3 ? 0.72 : 0.42,
                reason:
                    stats.count > 3
                        ? `${config.label} has enough data for threshold and streak automations.`
                        : `Log more ${config.label.toLowerCase()} data to activate this trigger.`,
                category: config.id,
                actionType: 'automation_candidate' as const,
            };
        });
}

function describeCorrelation(
    correlation: Correlation,
    customDefs: CustomCategoryDef[],
) {
    const a = getTrackingCategoryConfig(correlation.categoryA, customDefs);
    const b = getTrackingCategoryConfig(correlation.categoryB, customDefs);
    const direction =
        correlation.coefficient >= 0 ? 'moves with' : 'moves against';
    return `${a.label} ${correlation.metricA} ${direction} ${b.label} ${correlation.metricB} (n=${correlation.sampleSize}).`;
}
