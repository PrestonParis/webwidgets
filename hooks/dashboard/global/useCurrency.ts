'use client';

import { useState, useEffect } from 'react';

export interface CurrencyRates {
    base: string;
    date: string;
    rates: Record<string, number>;
}

export const POPULAR_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'CNY',
    'INR',
    'MXN',
];

const CACHE_KEY = 'currency_rates_v1';
const CACHE_TTL = 86_400_000; // 24 hours

export function useCurrency(base: string = 'USD') {
    const [rates, setRates] = useState<CurrencyRates | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);

        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp, cachedBase } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL && cachedBase === base) {
                    setRates(data);
                    setLoading(false);
                    return;
                }
            }
        } catch {
            /* stale cache */
        }

        (async () => {
            try {
                const targets = POPULAR_CURRENCIES.filter(
                    (c) => c !== base,
                ).join(',');
                const res = await fetch(
                    `https://api.frankfurter.app/latest?from=${base}&to=${targets}`,
                );
                if (!res.ok) throw new Error('API error');
                const data: CurrencyRates = await res.json();
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        data,
                        timestamp: Date.now(),
                        cachedBase: base,
                    }),
                );
                setRates(data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [base]);

    return { rates, loading, error };
}
