'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/db/supabase';
import {
    fetchEntries,
    migrateFromLocalStorage,
} from '@/features/tracking/api/trackingApi';
import { OLD_STORAGE_KEY } from '@/features/tracking/constants';
import type {
    TrackingEntry,
    FetchOptions,
} from '@/features/tracking/types/tracking';

export function useTrackingEntries(options?: FetchOptions): {
    entries: TrackingEntry[];
    loading: boolean;
    refetch: () => Promise<void>;
} {
    const [entries, setEntries] = useState<TrackingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const prevCategoryRef = useRef(options?.category);

    useEffect(() => {
        supabase.auth
            .getUser()
            .then(({ data: { user } }) => {
                setUserId(user?.id ?? null);
            })
            .catch(() => {
                setUserId(null);
            });
    }, []);

    const refetch = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await fetchEntries(userId, optionsRef.current ?? {});
            setEntries(data);
        } catch (err) {
            console.error('[useTrackingEntries] fetch error', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const run = async () => {
            const hasOld = localStorage.getItem(OLD_STORAGE_KEY);
            if (hasOld) {
                try {
                    await migrateFromLocalStorage(userId);
                } catch (err) {
                    console.error('[useTrackingEntries] migration error', err);
                }
            }
            await refetch();
        };

        void run();
    }, [userId, refetch]);

    useEffect(() => {
        if (!userId || prevCategoryRef.current === options?.category) return;
        prevCategoryRef.current = options?.category;
        void refetch();
    }, [options?.category, userId, refetch]);

    return { entries, loading, refetch };
}
