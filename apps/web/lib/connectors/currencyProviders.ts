import { z } from 'zod';
import type { CurrencyRates } from '@/features/currency/types/currency';

export const currencyRatesSchema = z.object({
    base: z.string(),
    date: z.string(),
    rates: z.record(z.string(), z.number()),
});

export const cachedCurrencyRatesSchema = currencyRatesSchema.extend({
    fetched_at: z.string(),
});

export async function fetchFrankfurterRates(
    base: string,
): Promise<CurrencyRates> {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`, {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    return currencyRatesSchema.parse(await res.json());
}

export async function fetchExchangeRateApiRates(
    base: string,
): Promise<CurrencyRates> {
    const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${base}`,
        {
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(6000),
        },
    );
    if (!res.ok) throw new Error(`ExchangeRate-API ${res.status}`);
    return currencyRatesSchema.parse(await res.json());
}

export async function fetchCurrencyRatesFromProviders(
    base: string,
): Promise<CurrencyRates> {
    try {
        return await fetchFrankfurterRates(base);
    } catch {
        return fetchExchangeRateApiRates(base);
    }
}
