'use client';

import { useMemo } from 'react';
import { calcCategoryStats } from '@/features/tracking/lib/analyticsEngine';
import type {
    TrackingEntry,
    TrackingCategory,
} from '@/features/tracking/types/tracking';
import type { TrackingStats } from '@/features/tracking/types/analytics';

export function useTrackingStats(
    entries: TrackingEntry[],
    category: TrackingCategory,
): TrackingStats {
    return useMemo(
        () => calcCategoryStats(entries, category),
        [entries, category],
    );
}
