'use client';

import { useReducer, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAdminFetch<T>(url: string): UseFetchResult<T> {
    type State = { data: T | null; loading: boolean; error: string | null };
    type Action =
        | { type: 'start' }
        | { type: 'ok'; data: T }
        | { type: 'err'; message: string };

    const [state, dispatch] = useReducer(
        (s: State, action: Action): State => {
            switch (action.type) {
                case 'start':
                    return { ...s, loading: true, error: null };
                case 'ok':
                    return { data: action.data, loading: false, error: null };
                case 'err':
                    return { ...s, loading: false, error: action.message };
            }
        },
        { data: null, loading: true, error: null },
    );
    const [tick, bumpTick] = useReducer((n: number) => n + 1, 0);

    useEffect(() => {
        let cancelled = false;
        dispatch({ type: 'start' });

        fetch(url)
            .then(async (res) => {
                const json = (await res.json()) as T;
                if (!cancelled) {
                    if (!res.ok) {
                        dispatch({
                            type: 'err',
                            message:
                                (json as Record<string, string>).error ??
                                'Request failed',
                        });
                    } else {
                        dispatch({ type: 'ok', data: json });
                    }
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    dispatch({
                        type: 'err',
                        message:
                            err instanceof Error
                                ? err.message
                                : 'Unknown error',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, tick]);

    const refetch = useCallback(() => bumpTick(), []);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        refetch,
    };
}
