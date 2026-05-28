import {
    calcCategoryStats,
    extractMetricSeries,
} from '@/features/tracking/lib/analyticsEngine';
import { findCorrelations } from '@/features/tracking/lib/correlationEngine';
import {
    getAllTrackingCategoryConfigs,
    getTrackingCategoryConfig,
} from '@/features/tracking/lib/categoryConfig';
import { summarizeCategoryMetrics } from '@/features/tracking/lib/metricRenderer';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { TrackingPrediction } from '@/features/tracking/types/trackingActionTypes';

const DEFAULT_CONSENT = {
    crossCategoryCorrelations: true,
    aiAnalysis: false,
    externalDataImport: false,
};

function clampConfidence(value: number): number {
    return Math.max(0.1, Math.min(0.95, Number(value.toFixed(2))));
}

export function predictTrackingConsistency(
    entries: TrackingEntry[],
    category: string,
    customDefs: CustomCategoryDef[] = [],
): TrackingPrediction {
    const config = getTrackingCategoryConfig(category, customDefs);
    const stats = calcCategoryStats(entries, category);
    const confidence = clampConfidence(
        0.35 +
            Math.min(stats.monthlyCount, 20) / 40 +
            Math.min(stats.currentStreak, 7) / 20,
    );

    if (stats.weeklyCount === 0) {
        return {
            id: `consistency-${category}`,
            label: `${config.label} streak at risk`,
            confidence,
            reason: `${config.label} has no logs this week. A quick entry would keep the signal alive.`,
            category,
            suggestedActionId: 'tracking.log_entry',
        };
    }

    return {
        id: `consistency-${category}`,
        label: `${config.label} signal is active`,
        confidence,
        reason: `${config.label} has ${stats.weeklyCount} logs this week and a ${stats.currentStreak}-day streak.`,
        category,
        suggestedActionId: 'tracking.review_progress',
    };
}

export function predictMetricDrift(
    entries: TrackingEntry[],
    category: string,
    customDefs: CustomCategoryDef[] = [],
): TrackingPrediction[] {
    const config = getTrackingCategoryConfig(category, customDefs);
    return summarizeCategoryMetrics(entries, category, customDefs).flatMap(
        (summary) => {
            if (summary.count < 4) return [];
            const delta = summary.latest - summary.avg;
            const threshold = Math.max(0.5, Math.abs(summary.avg) * 0.18);
            if (Math.abs(delta) < threshold) return [];

            return [
                {
                    id: `drift-${category}-${summary.metric.key}`,
                    label: `${summary.metric.label} ${delta > 0 ? 'above' : 'below'} baseline`,
                    confidence: clampConfidence(
                        0.48 + Math.min(summary.count, 20) / 50,
                    ),
                    reason: `${config.label} ${summary.metric.label.toLowerCase()} is ${delta > 0 ? 'higher' : 'lower'} than its recent average.`,
                    category,
                    suggestedActionId: 'tracking.inspect_metric',
                },
            ];
        },
    );
}

export function predictRecoveryNeed(
    entries: TrackingEntry[],
): TrackingPrediction | null {
    const workoutIntensity = extractMetricSeries(
        entries,
        'workout',
        'intensity',
    ).slice(-4);
    const sleepQuality = extractMetricSeries(entries, 'sleep', 'quality').slice(
        -4,
    );
    if (workoutIntensity.length < 3 || sleepQuality.length < 3) return null;

    const avgWorkout =
        workoutIntensity.reduce((sum, item) => sum + item.value, 0) /
        workoutIntensity.length;
    const avgSleep =
        sleepQuality.reduce((sum, item) => sum + item.value, 0) /
        sleepQuality.length;
    if (avgWorkout < 4 || avgSleep > 3) return null;

    return {
        id: 'recovery-need',
        label: 'Recovery day candidate',
        confidence: clampConfidence(0.55 + (avgWorkout - avgSleep) / 10),
        reason: 'Recent workout intensity is high while sleep quality is running lower.',
        category: 'workout',
        suggestedActionId: 'tracking.plan_recovery',
    };
}

export function generateTrackingPredictions(
    entries: TrackingEntry[],
    customDefs: CustomCategoryDef[] = [],
): TrackingPrediction[] {
    const configs = getAllTrackingCategoryConfigs(customDefs);
    const categoryPredictions = configs.flatMap((config) => [
        predictTrackingConsistency(entries, config.id, customDefs),
        ...predictMetricDrift(entries, config.id, customDefs),
    ]);

    const correlations = findCorrelations(entries, DEFAULT_CONSENT)
        .filter((correlation) => correlation.sampleSize >= 3)
        .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
        .slice(0, 2)
        .map((correlation) => ({
            id: `correlation-${correlation.categoryA}-${correlation.metricA}-${correlation.categoryB}-${correlation.metricB}`,
            label: 'Correlation worth reviewing',
            confidence: clampConfidence(Math.abs(correlation.coefficient)),
            reason: `${correlation.categoryA}.${correlation.metricA} and ${correlation.categoryB}.${correlation.metricB} have an ${correlation.significance}-sample relationship.`,
            category: correlation.categoryA,
            suggestedActionId: 'tracking.review_correlations',
        }));

    const recoveryNeed = predictRecoveryNeed(entries);

    return [
        ...categoryPredictions,
        ...correlations,
        ...(recoveryNeed ? [recoveryNeed] : []),
    ]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8);
}
