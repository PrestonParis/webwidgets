import type {
    DataPoint,
    Correlation,
} from '@/features/tracking/types/analytics';
import type { InsightConsent } from '@/features/tracking/types/insights';
import type { TrackingEntry } from '@/features/tracking/types/tracking';
import { extractMetricSeries } from '@/features/tracking/lib/analyticsEngine';
import { getAllTrackingCategoryConfigs } from '@/features/tracking/lib/categoryConfig';

export function alignTimeSeries(
    a: DataPoint[],
    b: DataPoint[],
): Array<{ a: number; b: number }> {
    const bMap = new Map(b.map((p) => [p.date, p.value]));
    return a.flatMap((p) => {
        const bVal = bMap.get(p.date);
        return bVal !== undefined ? [{ a: p.value, b: bVal }] : [];
    });
}

export function calcPearsonCorrelation(xs: number[], ys: number[]): number {
    if (xs.length < 3 || xs.length !== ys.length) return 0;

    const n = xs.length;
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    const my = ys.reduce((s, y) => s + y, 0) / n;

    let num = 0;
    let dx2 = 0;
    let dy2 = 0;

    for (let i = 0; i < n; i++) {
        const xv = xs[i] ?? 0;
        const yv = ys[i] ?? 0;
        const dx = xv - mx;
        const dy = yv - my;
        num += dx * dy;
        dx2 += dx * dx;
        dy2 += dy * dy;
    }

    const denom = Math.sqrt(dx2 * dy2);
    return denom === 0 ? 0 : num / denom;
}

function significanceLevel(sampleSize: number): 'low' | 'medium' | 'high' {
    if (sampleSize >= 30) return 'high';
    if (sampleSize >= 14) return 'medium';
    return 'low';
}

type CorrelationSpec = {
    categoryA: Parameters<typeof extractMetricSeries>[1];
    metricA: string;
    categoryB: Parameters<typeof extractMetricSeries>[1];
    metricB: string;
};

const BASE_CORRELATION_PAIRS: CorrelationSpec[] = [
    {
        categoryA: 'sleep',
        metricA: 'quality',
        categoryB: 'mood',
        metricB: 'score',
    },
    {
        categoryA: 'workout',
        metricA: 'intensity',
        categoryB: 'mood',
        metricB: 'score',
    },
    {
        categoryA: 'sleep',
        metricA: 'durationHours',
        categoryB: 'mood',
        metricB: 'energy',
    },
];

export function findCorrelations(
    entries: TrackingEntry[],
    consent: InsightConsent,
): Correlation[] {
    if (!consent.crossCategoryCorrelations) return [];

    const dynamicPairs = getAllTrackingCategoryConfigs()
        .filter((config) => config.supports.includes('correlations'))
        .flatMap((a, i, configs) =>
            configs.slice(i + 1).flatMap((b) => {
                const metricA = a.primaryMetric ?? a.metrics[0]?.key;
                const metricB = b.primaryMetric ?? b.metrics[0]?.key;
                return metricA && metricB
                    ? [{ categoryA: a.id, metricA, categoryB: b.id, metricB }]
                    : [];
            }),
        );

    const seen = new Set<string>();
    const pairs = [...BASE_CORRELATION_PAIRS, ...dynamicPairs].filter(
        (pair) => {
            const key = `${pair.categoryA}:${pair.metricA}:${pair.categoryB}:${pair.metricB}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        },
    );

    return pairs.flatMap(({ categoryA, metricA, categoryB, metricB }) => {
        const seriesA = extractMetricSeries(entries, categoryA, metricA);
        const seriesB = extractMetricSeries(entries, categoryB, metricB);
        const pairs = alignTimeSeries(seriesA, seriesB);
        if (pairs.length < 3) return [];

        const coefficient = calcPearsonCorrelation(
            pairs.map((p) => p.a),
            pairs.map((p) => p.b),
        );

        return [
            {
                categoryA,
                metricA,
                categoryB,
                metricB,
                coefficient,
                sampleSize: pairs.length,
                significance: significanceLevel(pairs.length),
            },
        ] satisfies Correlation[];
    });
}
