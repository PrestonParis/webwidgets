'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useMetricsFetch<T>(
    fetcher: () => Promise<T>,
    deps: unknown[],
): FetchState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const depsKey = JSON.stringify(deps);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetcherRef
            .current()
            .then((d) => {
                if (!cancelled) setData(d);
            })
            .catch((e: unknown) => {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : 'Unknown error');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [depsKey, tick]);

    const refetch = useCallback(() => setTick((t) => t + 1), []);
    return { data, loading, error, refetch };
}
