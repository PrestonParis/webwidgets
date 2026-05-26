'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/context/AuthContext';
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
    const { user } = useAuthContext();
    const userId = user?.id ?? null;
    const [entries, setEntries] = useState<TrackingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const prevCategoryRef = useRef(options?.category);

    const refetch = useCallback(async () => {
        if (!userId) {
            setEntries([]);
            setLoading(false);
            return;
        }
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
        if (!userId) {
            setEntries([]);
            setLoading(false);
            return;
        }

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
