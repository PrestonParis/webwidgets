'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    WatchlistItemWithLatest,
    AssetType,
} from '@/features/finance/types/watchlist';

export function useWatchlist() {
    const [items, setItems] = useState<WatchlistItemWithLatest[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/watchlist');
            if (!res.ok) throw new Error('Failed');
            const { items: data } = (await res.json()) as {
                items: WatchlistItemWithLatest[];
            };
            setItems(data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    const add = useCallback(
        async (input: {
            assetType: AssetType;
            symbol: string;
            displayName: string;
            currency?: string;
            config?: Record<string, unknown>;
        }) => {
            await fetch('/api/finance/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            await refetch();
        },
        [refetch],
    );

    const remove = useCallback(async (id: string) => {
        await fetch(`/api/finance/watchlist/${id}`, { method: 'DELETE' });
        setItems((cur) => cur.filter((i) => i.id !== id));
    }, []);

    const update = useCallback(
        async (
            id: string,
            input: Partial<{
                assetType: AssetType;
                symbol: string;
                displayName: string;
                currency: string;
                config: Record<string, unknown>;
            }>,
        ) => {
            await fetch(`/api/finance/watchlist/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            await refetch();
        },
        [refetch],
    );

    const fetchLatest = useCallback(
        async (id: string) => {
            const res = await fetch(`/api/finance/watchlist/${id}/fetch`, {
                method: 'POST',
            });
            const json = (await res.json()) as {
                reading?: unknown;
                needsManual?: boolean;
            };
            if (json.reading) await refetch();
            return json;
        },
        [refetch],
    );

    const logManual = useCallback(
        async (id: string, value: number) => {
            await fetch(`/api/finance/watchlist/${id}/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, source: 'manual' }),
            });
            await refetch();
        },
        [refetch],
    );

    return {
        items,
        loading,
        refetch,
        add,
        update,
        remove,
        fetchLatest,
        logManual,
    };
}
