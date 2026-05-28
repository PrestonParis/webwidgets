import { getTrackingCategoryConfig } from '@/features/tracking/lib/categoryConfig';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { TrackingMetricConfig } from '@/features/tracking/types/trackingConfigTypes';

export type RenderedMetric = {
    key: string;
    label: string;
    value: string;
    rawValue: number | boolean | string;
};

export function formatMetricValue(
    metric: TrackingMetricConfig,
    value: unknown,
): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
        const precision = metric.precision ?? (Number.isInteger(value) ? 0 : 1);
        const formatted = value.toLocaleString('en-US', {
            maximumFractionDigits: precision,
        });
        return metric.unit ? `${formatted}${metric.unit}` : formatted;
    }
    if (typeof value === 'string' && value.length > 0) return value;
    return '—';
}

export function renderEntryMetrics(
    entry: TrackingEntry,
    customDefs: CustomCategoryDef[] = [],
): RenderedMetric[] {
    const config = getTrackingCategoryConfig(entry.category, customDefs);
    return config.metrics
        .filter((metric) => entry.metadata[metric.key] !== undefined)
        .map((metric) => ({
            key: metric.key,
            label: metric.label,
            value: formatMetricValue(metric, entry.metadata[metric.key]),
            rawValue: entry.metadata[metric.key] as number | boolean | string,
        }));
}

export function getPrimaryMetricValue(
    entry: TrackingEntry,
    customDefs: CustomCategoryDef[] = [],
): RenderedMetric | null {
    const config = getTrackingCategoryConfig(entry.category, customDefs);
    const metric =
        config.metrics.find((item) => item.key === config.primaryMetric) ??
        config.metrics[0];
    if (!metric || entry.metadata[metric.key] === undefined) return null;
    return {
        key: metric.key,
        label: metric.label,
        value: formatMetricValue(metric, entry.metadata[metric.key]),
        rawValue: entry.metadata[metric.key] as number | boolean | string,
    };
}

export function summarizeCategoryMetrics(
    entries: TrackingEntry[],
    category: string,
    customDefs: CustomCategoryDef[] = [],
) {
    const config = getTrackingCategoryConfig(category, customDefs);
    return config.metrics.flatMap((metric) => {
        const values = entries
            .filter((entry) => entry.category === category)
            .map((entry) => entry.metadata[metric.key])
            .filter((value): value is number => typeof value === 'number');
        if (values.length === 0) return [];
        const avg =
            values.reduce((sum, value) => sum + value, 0) / values.length;
        const latest = values.at(-1) ?? avg;
        return [{ metric, avg, latest, count: values.length }];
    });
}
