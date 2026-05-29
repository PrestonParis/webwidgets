import { calcCategoryStats } from '@/features/tracking/lib/analyticsEngine';
import { findCorrelations } from '@/features/tracking/lib/correlationEngine';
import { getAllTrackingCategoryConfigs } from '@/features/tracking/lib/categoryConfig';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingAutomationRule } from '@/features/tracking/types/trackingActions';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

const CONSENT = {
    crossCategoryCorrelations: true,
    aiAnalysis: false,
    externalDataImport: false,
};

export function buildTrackingAutomationRules(
    entries: TrackingEntry[],
    customDefs: CustomCategoryDef[] = [],
): TrackingAutomationRule[] {
    const configs = getAllTrackingCategoryConfigs(customDefs);
    const rules: TrackingAutomationRule[] = configs.flatMap((config) => {
        const stats = calcCategoryStats(entries, config.id);
        const primaryMetric =
            config.primaryMetric ?? config.metrics[0]?.key ?? 'entry';

        return [
            {
                id: `${config.id}-missing-log`,
                label: `${config.label} missing log`,
                type: 'missing_log',
                enabled: stats.weeklyCount > 0,
                category: config.id,
                conditions: { daysWithoutLog: stats.weeklyCount > 0 ? 2 : 1 },
                action: {
                    type: 'suggest_entry',
                    label: `Prompt ${config.label.toLowerCase()} entry`,
                    target: '/tracking',
                },
            },
            {
                id: `${config.id}-streak-risk`,
                label: `${config.label} streak risk`,
                type: 'streak_risk',
                enabled:
                    config.supports.includes('streaks') &&
                    stats.currentStreak >= 2,
                category: config.id,
                conditions: {
                    currentStreak: stats.currentStreak,
                    minimumStreak: 2,
                },
                action: {
                    type: 'notify',
                    label: `Protect ${config.label.toLowerCase()} streak`,
                },
            },
            {
                id: `${config.id}-threshold`,
                label: `${config.label} threshold watch`,
                type: 'threshold_crossed',
                enabled:
                    config.supports.includes('automation') &&
                    stats.monthlyCount >= 3,
                category: config.id,
                conditions: { metric: primaryMetric, mode: 'outside_baseline' },
                action: {
                    type: 'review',
                    label: `Review ${primaryMetric} change`,
                    target: '/tracking',
                },
            },
        ];
    });

    const strongestCorrelation = findCorrelations(entries, CONSENT)
        .filter((correlation) => correlation.sampleSize >= 3)
        .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))[0];

    if (strongestCorrelation) {
        rules.unshift({
            id: 'cross-signal-correlation-review',
            label: 'Cross-signal correlation review',
            type: 'correlation_review',
            enabled: Math.abs(strongestCorrelation.coefficient) >= 0.45,
            conditions: {
                categoryA: strongestCorrelation.categoryA,
                metricA: strongestCorrelation.metricA,
                categoryB: strongestCorrelation.categoryB,
                metricB: strongestCorrelation.metricB,
                coefficient: strongestCorrelation.coefficient,
            },
            action: {
                type: 'review',
                label: 'Open correlation lab',
                target: '/tracking',
            },
        });
    }

    return rules
        .sort((a, b) => Number(b.enabled) - Number(a.enabled))
        .slice(0, 12);
}
