'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WatchlistReading } from '@/features/finance/types/watchlist';

export function useWatchlistChart(itemId: string | null) {
    const [readings, setReadings] = useState<WatchlistReading[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!itemId) return;
        setLoading(true);
        try {
            const res = await fetch(
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
        void load();
    }, [load]);

    return { readings, loading };
}
