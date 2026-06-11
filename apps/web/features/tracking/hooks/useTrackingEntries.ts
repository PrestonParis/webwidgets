'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import {
    fetchEntries,
    migrateFromLocalStorage,
} from '@/features/tracking/api/trackingApi';
import { OLD_STORAGE_KEY } from '@/features/tracking/constants';
import type {
    TrackingEntry,
    FetchOptions,
} from '@/features/tracking/types/trackingEntries';

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
    const prevCategoryRef = useRef(options?.category);

    // Keep optionsRef current without a reactive effect — direct assignment in
    // render is safe here because optionsRef is only read inside async callbacks,
    // never during render. This avoids running a sync effect on every render
    // (which happened because the caller passes a new object literal each time).
    optionsRef.current = options;

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
        const timeoutId = window.setTimeout(() => {
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
                        console.error(
                            '[useTrackingEntries] migration error',
                            err,
                        );
                    }
                }
                await refetch();
            };

            void run();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [userId, refetch]);

    useEffect(() => {
        if (!userId || prevCategoryRef.current === options?.category) return;
        prevCategoryRef.current = options?.category;
        void refetch();
    }, [options?.category, userId, refetch]);

    return { entries, loading, refetch };
}
