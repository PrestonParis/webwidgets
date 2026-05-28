'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    searchFoods,
    availableSearchProviders,
    type FoodSearchOutcome,
} from '@/features/tracking/lib/meal/nutrition/providers';
import type { FoodSearchResult } from '@/features/tracking/lib/meal/nutrition/foodTypes';

const DEBOUNCE_MS = 300;

export interface UseFoodSearchResult {
    query: string;
    setQuery: (q: string) => void;
    results: FoodSearchResult[];
    loading: boolean;
    errors: FoodSearchOutcome['errors'];
    providerLabels: string[];
    hasProviders: boolean;
    clear: () => void;
}

/**
 * Debounced food search across available providers. Provider logic lives in the
 * registry; this hook only manages debounce + request lifecycle + state.
 */
export function useFoodSearch(): UseFoodSearchResult {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FoodSearchOutcome['errors']>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reqIdRef = useRef(0);

    const providers = availableSearchProviders();
    const providerLabels = providers.map((p) => p.label);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            timerRef.current = setTimeout(() => {
                setResults([]);
                setErrors([]);
                setLoading(false);
            }, 0);
            return;
        }
        window.setTimeout(() => setLoading(true), 0);
        const id = ++reqIdRef.current;
        timerRef.current = setTimeout(() => {
            void searchFoods(trimmed)
                .then((outcome) => {
                    // ignore stale responses
                    if (id !== reqIdRef.current) return;
                    setResults(outcome.results);
                    setErrors(outcome.errors);
                })
                .catch(() => {
                    if (id !== reqIdRef.current) return;
                    setResults([]);
                    setErrors([
                        {
                            provider: 'all',
                            code: 'network',
                            message: 'Search failed.',
                        },
                    ]);
                })
                .finally(() => {
                    if (id === reqIdRef.current) setLoading(false);
                });
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query]);

    const clear = useCallback(() => {
        setQuery('');
        setResults([]);
        setErrors([]);
        setLoading(false);
    }, []);

    return {
        query,
        setQuery,
        results,
        loading,
        errors,
        providerLabels,
        hasProviders: providers.length > 0,
        clear,
    };
}
