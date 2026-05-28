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

    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    const depsKey = JSON.stringify(deps);

    useEffect(() => {
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            setLoading(true);
            setError(null);

            fetcherRef
                .current()
                .then((d) => {
                    if (!cancelled) setData(d);
                })
                .catch((e: unknown) => {
                    if (!cancelled)
                        setError(
                            e instanceof Error ? e.message : 'Unknown error',
                        );
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [depsKey, tick]);

    const refetch = useCallback(() => setTick((t) => t + 1), []);
    return { data, loading, error, refetch };
}
