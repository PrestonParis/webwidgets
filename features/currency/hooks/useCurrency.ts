'use client';

import { useEffect, useReducer, useCallback } from 'react';
import { z } from 'zod';
import type { CurrencyRates } from '@/features/currency/types/currency';

const CLIENT_CACHE_TTL = 30 * 60 * 1000; // 30 min — polling interval matches
const POLL_INTERVAL = 30 * 60 * 1000;
const CACHE_KEY_PREFIX = 'currency_rates_v2';
const RATES_API = '/api/currency/rates';

type State = {
    rates: CurrencyRates | null;
    loading: boolean;
    error: boolean;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: CurrencyRates }
    | { type: 'FETCH_ERROR' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: false };
        case 'FETCH_SUCCESS':
            return { rates: action.payload, loading: false, error: false };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: true };
        default:
            return state;
    }
}

const cachedEntrySchema = z.object({
    data: z
        .object({
            base: z.string(),
            date: z.string(),
            rates: z.record(z.string(), z.number()),
        })
        .passthrough(),
    timestamp: z.number(),
});

function readCache(base: string): CurrencyRates | null {
    try {
        const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}_${base}`);
        if (!raw) return null;
        const parsed = cachedEntrySchema.safeParse(JSON.parse(raw) as unknown);
        if (!parsed.success) return null;
        if (Date.now() - parsed.data.timestamp > CLIENT_CACHE_TTL) return null;
        return parsed.data.data as CurrencyRates;
    } catch {
        return null;
    }
}

function writeCache(base: string, data: CurrencyRates) {
    try {
        localStorage.setItem(
            `${CACHE_KEY_PREFIX}_${base}`,
            JSON.stringify({ data, timestamp: Date.now() }),
        );
    } catch {
        // localStorage unavailable — non-fatal
    }
}

function isCacheStale(base: string): boolean {
    try {
        const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}_${base}`);
        if (!raw) return true;
        const parsed = cachedEntrySchema.safeParse(JSON.parse(raw) as unknown);
        if (!parsed.success) return true;
        return Date.now() - parsed.data.timestamp > CLIENT_CACHE_TTL;
    } catch {
        return true;
    }
}

export function useCurrency(base: string | null = 'USD') {
    const [state, dispatch] = useReducer(reducer, {
        rates: null,
        loading: base !== null,
        error: false,
    });

    const fetchRates = useCallback(
        async (force = false) => {
            if (!base) return;

            if (!force) {
                const cached = readCache(base);
                if (cached) {
                    dispatch({ type: 'FETCH_SUCCESS', payload: cached });
                    return;
                }
            }

            dispatch({ type: 'FETCH_START' });

            try {
                const res = await fetch(`${RATES_API}?base=${base}`);
                if (!res.ok) throw new Error(`API ${res.status}`);
                const data = (await res.json()) as CurrencyRates;
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
                writeCache(base, data);
            } catch {
                dispatch({ type: 'FETCH_ERROR' });
            }
        },
        [base],
    );

    // Initial fetch (also resets state when base becomes null)
    useEffect(() => {
        if (!base) {
            dispatch({
                type: 'FETCH_SUCCESS',
                payload: { base: '', date: '', rates: {} },
            });
            return;
        }
        void fetchRates();
    }, [base, fetchRates]);

    // Poll every 30 minutes
    useEffect(() => {
        if (!base) return;
        const id = setInterval(() => void fetchRates(true), POLL_INTERVAL);
        return () => clearInterval(id);
    }, [base, fetchRates]);

    // Refresh on window focus if client cache is stale
    useEffect(() => {
        if (!base) return;
        const onFocus = () => {
            if (isCacheStale(base)) void fetchRates(true);
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [base, fetchRates]);

    return state;
}
