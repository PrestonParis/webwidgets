import type { BuiltInCategory } from '@/features/tracking/types/tracking';
import type { MealType } from '@/features/tracking/types/metadata';

export {
    getCategoryLabel,
    getCategoryEmoji,
    getCategoryColor,
    CATEGORY_LABELS,
    CATEGORY_EMOJIS,
    CATEGORY_COLORS,
} from '@/features/tracking/categoryHelpers';
export {
    TRACKING_CATEGORY_CONFIGS,
    getTrackingCategoryConfig,
    getAllTrackingCategoryConfigs,
} from '@/features/tracking/lib/categoryConfig';

export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
    'sleep',
    'workout',
    'meal',
    'mood',
    'supplement',
    'symptom',
    'injury',
];

export const TRACKING_CATEGORIES = BUILT_IN_CATEGORIES;

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
};

export const OLD_STORAGE_KEY = 'tracking_entries';
export const CUSTOM_CATEGORIES_KEY = 'tracking_custom_categories';
