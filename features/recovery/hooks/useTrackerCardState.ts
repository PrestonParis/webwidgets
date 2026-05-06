import { useEffect, useMemo, useState } from 'react';
import { Tracker } from '@/features/recovery/types/recovery';
import {
    fetchRelapses,
    computeLongestStreakDays,
} from '@/features/recovery/lib/relapses';
import { useSecondsClean } from '@/features/recovery/hooks/useSecondsClean';

export function useTrackerCardState(tracker: Tracker) {
    const [editingStart, setEditingStart] = useState(false);
    const [relapses, setRelapses] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        void fetchRelapses(tracker.id).then(setRelapses);
    }, [tracker.id]);

    const startTime = tracker.start_time;
    const secondsClean = useSecondsClean(startTime);

    const startDateLabel = useMemo(() => {
        const d = new Date(startTime);
        return {
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            }),
        };
    }, [startTime]);

    const longestDays = useMemo(
        () => computeLongestStreakDays(tracker.created_at, relapses),
        [tracker.created_at, relapses],
    );

    return {
        startTime,
        editingStart,
        setEditingStart,
        relapses,
        expanded,
        setExpanded,
        secondsClean,
        startDateLabel,
        longestDays,
    };
}
