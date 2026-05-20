'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    listActivityEvents,
    recordActivityEvent,
} from '@/features/activity/services/activityService';
import type { ActivityEvent } from '@/features/activity/types/activity';

export function useActivityEvents() {
    const { userId } = useAuth();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setEvents(await listActivityEvents(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listActivityEvents(userId).then((next) => {
            if (active) setEvents(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createEvent = useCallback(
        async (input: Omit<ActivityEvent, 'id' | 'userId' | 'createdAt'>) => {
            if (!userId) return null;
            const event = await recordActivityEvent({ ...input, userId });
            setEvents((current) => [event, ...current]);
            return event;
        },
        [userId],
    );

    return { events, loading, reload, createEvent };
}
