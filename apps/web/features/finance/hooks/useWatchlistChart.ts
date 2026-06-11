'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState, useEffect, useCallback } from 'react';
import type { WatchlistReading } from '@/features/finance/types/watchlist';

export function useWatchlistChart(itemId: string | null) {
    const [readings, setReadings] = useState<WatchlistReading[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!itemId) return;
        setLoading(true);
        try {
            const res = await apiRouteFetch(
                `/api/finance/watchlist/${itemId}/readings`,
            );
            if (!res.ok) return;
            const { readings: data } = (await res.json()) as {
                readings: WatchlistReading[];
            };
            setReadings((data ?? []).slice().reverse());
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [load]);

    return { readings, loading };
}
