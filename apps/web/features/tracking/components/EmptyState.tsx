'use client';

import {
    getCategoryEmoji,
    getCategoryLabel,
} from '@/features/tracking/constants';
import type { TrackingCategory } from '@/features/tracking/types/trackingCategoryTypes';

interface EmptyStateProps {
    category: TrackingCategory;
    onLogFirst?: () => void;
}

export function EmptyState({ category, onLogFirst }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="text-4xl">{getCategoryEmoji(category)}</span>
            <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    No {getCategoryLabel(category).toLowerCase()} logged yet
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Log your first entry to start tracking trends.
                </p>
            </div>
            {onLogFirst && (
                <button
                    onClick={onLogFirst}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                    Log first entry
                </button>
            )}
        </div>
    );
}
