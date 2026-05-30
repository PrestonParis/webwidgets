import type { InsightProvider } from '@/features/tracking/types/insightProviders';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type {
    Insight,
    InsightConsent,
    InsightContext,
} from '@/features/tracking/types/insights';
import {
    filterByCategory,
    extractMetricSeries,
    calcTrend,
    calcCurrentStreak,
} from '@/features/tracking/lib/analyticsEngine';
import { findCorrelations } from '@/features/tracking/lib/correlationEngine';

function makeId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
}

function now(): string {
    return new Date().toISOString();
}

function sleepDecliningInsight(entries: TrackingEntry[]): Insight | null {
    const series = extractMetricSeries(entries, 'sleep', 'durationHours');
    if (series.length < 5) return null;
    const trend = calcTrend(series, 'week');
    if (trend.direction !== 'declining') return null;

    return {
        id: makeId(),
        category: 'sleep',
        title: 'Sleep duration is trending down',
        body: `Your average sleep duration has declined over the past week. Aim for 7–9 hours consistently.`,
        confidence: trend.magnitude > 0.2 ? 'high' : 'medium',
        source: 'rule-based',
        generatedAt: now(),
        relatedCategories: ['sleep'],
    };
}

function strongWorkoutStreakInsight(entries: TrackingEntry[]): Insight | null {
    const streak = calcCurrentStreak(entries, 'workout');
    if (streak < 5) return null;

    return {
        id: makeId(),
        category: 'workout',
        title: `${streak}-day workout streak`,
        body: `You've worked out ${streak} days in a row. Great consistency, keep it up.`,
        confidence: 'high',
        source: 'rule-based',
        generatedAt: now(),
        relatedCategories: ['workout'],
    };
}

function moodConsistencyInsight(entries: TrackingEntry[]): Insight | null {
    const series = extractMetricSeries(entries, 'mood', 'score');
    if (series.length < 7) return null;

    const values = series.map((p) => p.value);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance =
        values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);

    if (stddev > 0.8) return null;

    return {
        id: makeId(),
        category: 'mood',
        title: 'Stable mood pattern',
        body: `Your mood scores have been consistent (avg ${mean.toFixed(1)}/5). Emotional stability supports better decision-making.`,
        confidence: 'medium',
        source: 'rule-based',
        generatedAt: now(),
        relatedCategories: ['mood'],
    };
}

function workoutMoodCorrelationInsight(
    entries: TrackingEntry[],
    consent: InsightConsent,
): Insight | null {
    const correlations = findCorrelations(entries, consent);
    const wmCorr = correlations.find(
        (c) =>
            c.categoryA === 'workout' &&
            c.categoryB === 'mood' &&
            c.coefficient > 0.5,
    );
    if (!wmCorr) return null;

    return {
        id: makeId(),
        category: 'cross-category',
        title: 'Workouts correlate with better mood',
        body: `Your data shows a ${(wmCorr.coefficient * 100).toFixed(0)}% positive correlation between workout intensity and mood score.`,
        confidence: wmCorr.significance === 'high' ? 'high' : 'medium',
        source: 'rule-based',
        generatedAt: now(),
        relatedCategories: ['workout', 'mood'],
    };
}

function missingDataGapInsight(entries: TrackingEntry[]): Insight | null {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const cutoff = threeDaysAgo.toISOString().slice(0, 10);

    const categories = ['sleep', 'workout', 'mood'] as const;
    for (const cat of categories) {
        const filtered = filterByCategory(entries, cat);
        const recent = filtered.filter((e) => e.entryDate >= cutoff);
        if (filtered.length > 0 && recent.length === 0) {
            return {
                id: makeId(),
                category: cat,
                title: `No ${cat} logs in 3+ days`,
                body: `You haven't logged ${cat} recently. Consistent tracking helps identify patterns.`,
                confidence: 'low',
                source: 'rule-based',
                generatedAt: now(),
                relatedCategories: [cat],
            };
        }
    }
    return null;
}

function supplementAdherenceInsight(entries: TrackingEntry[]): Insight | null {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().slice(0, 10);

    const recent = filterByCategory(entries, 'supplement').filter(
        (e) => e.entryDate >= cutoff,
    );
    if (recent.length === 0) return null;

    const taken = recent.filter((e) => e.metadata['taken'] === true).length;
    const pct = Math.round((taken / recent.length) * 100);

    if (pct >= 85) return null;

    return {
        id: makeId(),
        category: 'supplement',
        title: `Supplement adherence: ${pct}% this week`,
        body: `You took your supplements ${taken} of ${recent.length} times this week. Consistency improves effectiveness.`,
        confidence: 'medium',
        source: 'rule-based',
        generatedAt: now(),
        relatedCategories: ['supplement'],
    };
}

export class RuleBasedInsightProvider implements InsightProvider {
    readonly name = 'rule-based';

    canProvide(entries: TrackingEntry[], consent: InsightConsent): boolean {
        void consent;
        return entries.length >= 3;
    }

    analyze(
        entries: TrackingEntry[],
        context: InsightContext,
    ): Promise<Insight[]> {
        void context;
        const consent: InsightConsent = {
            aiAnalysis: false,
            crossCategoryCorrelations: true,
            externalDataImport: false,
        };

        const candidates = [
            sleepDecliningInsight(entries),
            strongWorkoutStreakInsight(entries),
            moodConsistencyInsight(entries),
            workoutMoodCorrelationInsight(entries, consent),
            missingDataGapInsight(entries),
            supplementAdherenceInsight(entries),
        ];

        return Promise.resolve(
            candidates.filter((i): i is Insight => i !== null),
        );
    }
}
