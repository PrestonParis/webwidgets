'use client';

import { useEffect, useReducer } from 'react';
import { CurrencyRates } from '@/features/currency/types/currency';
import { CACHE_KEY, CACHE_TTL } from '@/features/currency/constants';

type State = {
    rates: CurrencyRates | null;
    loading: boolean;
    error: boolean;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: CurrencyRates }
    | { type: 'FETCH_ERROR' };

const initialState: State = {
    rates: null,
    loading: true,
    error: false,
};

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

interface CachedEntry {
    data: CurrencyRates;
    timestamp: number;
}

function readCache(base: string): CurrencyRates | null {
    try {
        const raw = localStorage.getItem(`${CACHE_KEY}_${base}`);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CachedEntry;
        if (Date.now() - entry.timestamp > CACHE_TTL) return null;
        return entry.data;
    } catch {
        return null;
    }
}

function writeCache(base: string, data: CurrencyRates) {
    try {
        const entry: CachedEntry = { data, timestamp: Date.now() };
        localStorage.setItem(`${CACHE_KEY}_${base}`, JSON.stringify(entry));
    } catch {
        // localStorage unavailable — non-fatal
    }
}

export function useCurrency(base: string = 'USD') {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        let cancelled = false;

        const fetchRates = async () => {
            // Serve from cache if still fresh
            const cached = readCache(base);
            if (cached) {
                dispatch({ type: 'FETCH_SUCCESS', payload: cached });
                return;
            }

            dispatch({ type: 'FETCH_START' });

            try {
                const res = await fetch(
                    `https://api.frankfurter.app/latest?from=${base}`,
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as CurrencyRates;

                if (!cancelled) {
                    dispatch({ type: 'FETCH_SUCCESS', payload: json });
                    writeCache(base, json);
                }
            } catch {
                if (!cancelled) dispatch({ type: 'FETCH_ERROR' });
            }
        };

        void fetchRates();

        return () => {
            cancelled = true;
        };
    }, [base]);

    return state;
}
