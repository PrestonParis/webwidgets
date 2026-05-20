'use client';

import { useTrackingEntries } from './useTrackingEntries';
import { useTrackingActions } from './useTrackingActions';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import type { TrackingCategory } from '@/features/tracking/types/tracking';

export function useTrackingWidgetData(category: TrackingCategory) {
    const { entries, refetch } = useTrackingEntries({ category, limit: 30 });
    const { entries: allEntries } = useTrackingEntries({ limit: 80 });
    const { trackers } = useTrackers();
    const { handleAdd } = useTrackingActions(refetch);

    return { entries, allEntries, trackers, handleAdd, refetch };
}
