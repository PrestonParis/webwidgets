import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { BuiltInCategory } from '@/features/tracking/types/trackingCategoryTypes';
import type {
    TrackingCategoryConfig,
    TrackingMetricConfig,
} from '@/features/tracking/types/trackingConfigTypes';

export { TRACKING_CATEGORY_CONFIGS } from './categoryConfigData';
import { TRACKING_CATEGORY_CONFIGS } from './categoryConfigData';
export function customCategoryToConfig(
    def: CustomCategoryDef,
): TrackingCategoryConfig {
    const metrics: TrackingMetricConfig[] = def.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type:
            field.type === 'boolean'
                ? 'boolean'
                : field.type === 'number' || field.type === 'range'
                  ? 'measurement'
                  : 'custom',
        unit: field.unit,
        min: field.min,
        max: field.max,
    }));

    return {
        id: def.id,
        label: def.label,
        icon: def.emoji,
        color: def.color,
        metricType:
            metrics.length > 1 ? 'multi' : (metrics[0]?.type ?? 'custom'),
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
        ],
        primaryMetric: metrics[0]?.key,
        metrics,
        automationEvents: [
            `${def.id}_threshold_crossed`,
            `${def.id}_streak_at_risk`,
        ],
    };
}

export function getTrackingCategoryConfig(
    category: string,
    customDefs: CustomCategoryDef[] = [],
): TrackingCategoryConfig {
    return (
        TRACKING_CATEGORY_CONFIGS[category as BuiltInCategory] ??
        customCategoryToConfig(
            customDefs.find((def) => def.id === category) ?? {
                id: category,
                label: category,
                emoji: '📊',
                color: 'indigo',
                fields: [],
                createdAt: new Date().toISOString(),
            },
        )
    );
}

export function getAllTrackingCategoryConfigs(
    customDefs: CustomCategoryDef[] = [],
): TrackingCategoryConfig[] {
    return [
        ...Object.values(TRACKING_CATEGORY_CONFIGS),
        ...customDefs.map(customCategoryToConfig),
    ];
}
