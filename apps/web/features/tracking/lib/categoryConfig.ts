import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type {
    BuiltInCategory,
    TrackingCategoryConfig,
    TrackingMetricConfig,
} from '@/features/tracking/types/tracking';

export const TRACKING_CATEGORY_CONFIGS: Record<
    BuiltInCategory,
    TrackingCategoryConfig
> = {
    sleep: {
        id: 'sleep',
        label: 'Sleep',
        icon: '😴',
        color: 'blue',
        metricType: 'multi',
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
        ],
        primaryMetric: 'durationHours',
        metrics: [
            {
                key: 'durationHours',
                label: 'Duration',
                type: 'duration',
                unit: 'h',
                min: 0,
                max: 14,
                precision: 1,
            },
            {
                key: 'quality',
                label: 'Quality',
                type: 'rating',
                min: 1,
                max: 5,
            },
        ],
        automationEvents: ['sleep_low_quality', 'sleep_debt_building'],
    },
    workout: {
        id: 'workout',
        label: 'Workouts',
        icon: '🏋️',
        color: 'orange',
        metricType: 'multi',
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
        ],
        primaryMetric: 'duration',
        metrics: [
            {
                key: 'duration',
                label: 'Duration',
                type: 'duration',
                unit: 'min',
            },
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'rating',
                min: 1,
                max: 5,
            },
        ],
        automationEvents: ['workout_streak_at_risk', 'recovery_day_suggested'],
    },
    meal: {
        id: 'meal',
        label: 'Meals',
        icon: '🍽️',
        color: 'green',
        metricType: 'multi',
        supports: [
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
            'attachments',
        ],
        primaryMetric: 'protein',
        metrics: [
            {
                key: 'calories',
                label: 'Calories',
                type: 'measurement',
                unit: 'kcal',
            },
            {
                key: 'protein',
                label: 'Protein',
                type: 'measurement',
                unit: 'g',
            },
        ],
        automationEvents: ['protein_below_target', 'meal_pattern_changed'],
    },
    mood: {
        id: 'mood',
        label: 'Mood',
        icon: '🧠',
        color: 'pink',
        metricType: 'rating',
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
        ],
        primaryMetric: 'score',
        metrics: [
            { key: 'score', label: 'Mood', type: 'rating', min: 1, max: 5 },
            { key: 'energy', label: 'Energy', type: 'rating', min: 1, max: 5 },
        ],
        automationEvents: ['mood_drop_detected', 'energy_low'],
    },
    supplement: {
        id: 'supplement',
        label: 'Supplements',
        icon: '💊',
        color: 'purple',
        metricType: 'boolean',
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
        ],
        primaryMetric: 'taken',
        metrics: [{ key: 'taken', label: 'Taken', type: 'boolean' }],
        automationEvents: ['supplement_missed'],
    },
    symptom: {
        id: 'symptom',
        label: 'Symptoms',
        icon: '🤒',
        color: 'amber',
        metricType: 'rating',
        supports: [
            'correlations',
            'predictions',
            'automation',
            'journal',
            'attachments',
        ],
        primaryMetric: 'severity',
        metrics: [
            {
                key: 'severity',
                label: 'Severity',
                type: 'rating',
                min: 1,
                max: 10,
            },
        ],
        automationEvents: ['symptom_spike_detected'],
    },
    injury: {
        id: 'injury',
        label: 'Injuries',
        icon: '🩹',
        color: 'red',
        metricType: 'multi',
        supports: [
            'streaks',
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
            'attachments',
        ],
        primaryMetric: 'severity',
        metrics: [
            { key: 'severity', label: 'Pain', type: 'rating', min: 1, max: 10 },
            {
                key: 'mobility',
                label: 'Mobility',
                type: 'rating',
                min: 1,
                max: 10,
            },
        ],
        automationEvents: ['pain_spike_detected', 'mobility_declining'],
    },
    health: {
        id: 'health',
        label: 'Health Tracker',
        icon: '❤️‍🩹',
        color: 'pink',
        metricType: 'multi',
        supports: [
            'correlations',
            'goals',
            'predictions',
            'automation',
            'journal',
            'attachments',
        ],
        primaryMetric: 'energyLevel',
        metrics: [
            {
                key: 'energyLevel',
                label: 'Energy',
                type: 'rating',
                min: 1,
                max: 10,
            },
            {
                key: 'sleepQuality',
                label: 'Sleep quality',
                type: 'rating',
                min: 1,
                max: 10,
            },
        ],
        automationEvents: ['recovery_suggested', 'biometric_anomaly'],
    },
};

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
