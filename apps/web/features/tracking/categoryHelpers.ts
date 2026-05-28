import type { BuiltInCategory } from '@/features/tracking/types/trackingCategoryTypes';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import {
    TRACKING_CATEGORY_CONFIGS,
    getTrackingCategoryConfig,
} from '@/features/tracking/lib/categoryConfig';

export const CATEGORY_LABELS: Record<BuiltInCategory, string> = {
    sleep: TRACKING_CATEGORY_CONFIGS.sleep.label,
    workout: TRACKING_CATEGORY_CONFIGS.workout.label,
    meal: TRACKING_CATEGORY_CONFIGS.meal.label,
    mood: TRACKING_CATEGORY_CONFIGS.mood.label,
    supplement: TRACKING_CATEGORY_CONFIGS.supplement.label,
    symptom: TRACKING_CATEGORY_CONFIGS.symptom.label,
    injury: TRACKING_CATEGORY_CONFIGS.injury.label,
    health: TRACKING_CATEGORY_CONFIGS.health.label,
};

export const CATEGORY_EMOJIS: Record<BuiltInCategory, string> = {
    sleep: TRACKING_CATEGORY_CONFIGS.sleep.icon,
    workout: TRACKING_CATEGORY_CONFIGS.workout.icon,
    meal: TRACKING_CATEGORY_CONFIGS.meal.icon,
    mood: TRACKING_CATEGORY_CONFIGS.mood.icon,
    supplement: TRACKING_CATEGORY_CONFIGS.supplement.icon,
    symptom: TRACKING_CATEGORY_CONFIGS.symptom.icon,
    injury: TRACKING_CATEGORY_CONFIGS.injury.icon,
    health: TRACKING_CATEGORY_CONFIGS.health.icon,
};

export const CATEGORY_COLORS: Record<BuiltInCategory, string> = {
    sleep: TRACKING_CATEGORY_CONFIGS.sleep.color ?? 'blue',
    workout: TRACKING_CATEGORY_CONFIGS.workout.color ?? 'orange',
    meal: TRACKING_CATEGORY_CONFIGS.meal.color ?? 'green',
    mood: TRACKING_CATEGORY_CONFIGS.mood.color ?? 'pink',
    supplement: TRACKING_CATEGORY_CONFIGS.supplement.color ?? 'purple',
    symptom: TRACKING_CATEGORY_CONFIGS.symptom.color ?? 'amber',
    injury: TRACKING_CATEGORY_CONFIGS.injury.color ?? 'red',
    health: TRACKING_CATEGORY_CONFIGS.health.color ?? 'pink',
};

export function getCategoryLabel(
    cat: string,
    customDefs?: CustomCategoryDef[],
): string {
    const builtin = CATEGORY_LABELS[cat as BuiltInCategory];
    if (builtin) return builtin;
    return getTrackingCategoryConfig(cat, customDefs).label;
}

export function getCategoryEmoji(
    cat: string,
    customDefs?: CustomCategoryDef[],
): string {
    const builtin = CATEGORY_EMOJIS[cat as BuiltInCategory];
    if (builtin) return builtin;
    return getTrackingCategoryConfig(cat, customDefs).icon;
}

export function getCategoryColor(
    cat: string,
    customDefs?: CustomCategoryDef[],
): string {
    const builtin = CATEGORY_COLORS[cat as BuiltInCategory];
    if (builtin) return builtin;
    return getTrackingCategoryConfig(cat, customDefs).color ?? 'indigo';
}
