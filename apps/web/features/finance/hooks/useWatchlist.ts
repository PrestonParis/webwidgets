'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    WatchlistItemWithLatest,
    AssetType,
} from '@/features/finance/types/watchlist';

async function fetchWithRetry<T>(
    url: string,
    options?: RequestInit,
    maxRetries = 2,
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                if (res.status >= 500 && i < maxRetries) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, Math.pow(2, i) * 1000),
                    );
                    continue;
                }
                throw new Error(`HTTP ${res.status}`);
            }
            return (await res.json()) as T;
        } catch (err) {
            lastError =
                err instanceof Error
                    ? err
                    : new Error('Unknown error');
            if (i < maxRetries) {
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, i) * 1000),
                );
            }
        }
    }

    throw lastError || new Error('Failed after retries');
}

export function useWatchlist() {
    const [items, setItems] = useState<WatchlistItemWithLatest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { items: data } = await fetchWithRetry<{
                items: WatchlistItemWithLatest[];
            }>('/api/finance/watchlist');
            setItems(data ?? []);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to load watchlist';
            setError(message);
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
            try {
                setError(null);
                await fetchWithRetry('/api/finance/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                });
                await refetch();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to add watchlist item';
                setError(message);
                throw err;
            }
        },
        [refetch],
    );

    const remove = useCallback(
        async (id: string) => {
            try {
                setError(null);
                await fetchWithRetry(`/api/finance/watchlist/${id}`, {
                    method: 'DELETE',
                });
                setItems((cur) => cur.filter((i) => i.id !== id));
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to remove watchlist item';
                setError(message);
                throw err;
            }
        },
        [],
    );

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
            try {
                setError(null);
                await fetchWithRetry(`/api/finance/watchlist/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                });
                await refetch();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to update watchlist item';
                setError(message);
                throw err;
            }
        },
        [refetch],
    );

    const fetchLatest = useCallback(
        async (id: string) => {
            try {
                setError(null);
                const json = await fetchWithRetry<{
                    reading?: unknown;
                    needsManual?: boolean;
                }>(`/api/finance/watchlist/${id}/fetch`, {
                    method: 'POST',
                });
                if (json.reading) await refetch();
                return json;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to fetch latest price';
                setError(message);
                throw err;
            }
        },
        [refetch],
    );

    const logManual = useCallback(
        async (id: string, value: number) => {
            try {
                setError(null);
                await fetchWithRetry(
                    `/api/finance/watchlist/${id}/readings`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            value,
                            source: 'manual',
                        }),
                    },
                );
                await refetch();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Failed to log reading';
                setError(message);
                throw err;
            }
        },
        [refetch],
    );

    return {
        items,
        loading,
        error,
        refetch,
        add,
        update,
        remove,
        fetchLatest,
        logManual,
    };
}
