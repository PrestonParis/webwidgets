'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAdminFetch<T>(url: string): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(url)
            .then(async (res) => {
                const json = (await res.json()) as T;
                if (!cancelled) {
                    if (!res.ok)
                        setError(
                            (json as Record<string, string>).error ??
                                'Request failed',
                        );
                    else setData(json);
                }
            })
            .catch((err: unknown) => {
                if (!cancelled)
                    setError(
                        err instanceof Error ? err.message : 'Unknown error',
                    );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [url, tick]);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    return { data, loading, error, refetch };
}
