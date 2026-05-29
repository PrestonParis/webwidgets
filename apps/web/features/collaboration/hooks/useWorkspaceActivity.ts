'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityRecord } from '../types/collaboration';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

const POLL_INTERVAL_MS = 30_000;

export function useWorkspaceActivity(workspaceId: string) {
    const [events, setEvents] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const activityUrl = `/api/collaboration/workspaces/${workspaceId}/activity`;

    const fetchActivity = useCallback(async () => {
        if (!workspaceId) {
            setEvents([]);
            setLoading(false);
            return;
        }
        try {
            const data = await cachedJson<ActivityRecord[]>(activityUrl, {
                ttlMs: 25_000,
            });
            setEvents(Array.isArray(data) ? data : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [workspaceId, activityUrl]);

    useEffect(() => {
        setLoading(true);
        void fetchActivity();

        timerRef.current = setInterval(() => {
            clearCachedJson(activityUrl);
            void fetchActivity();
        }, POLL_INTERVAL_MS);

        return () => {
            if (timerRef.current !== null) clearInterval(timerRef.current);
        };
    }, [fetchActivity, activityUrl]);

    const refresh = useCallback(() => {
        clearCachedJson(activityUrl);
        void fetchActivity();
    }, [fetchActivity, activityUrl]);

    return { events, loading, refresh };
}
