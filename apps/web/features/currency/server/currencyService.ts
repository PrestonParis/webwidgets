import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrencyRates } from '@/features/currency/types/currency';
import {
    cachedCurrencyRatesSchema,
    fetchCurrencyRatesFromProviders,
} from '@/lib/connectors/currencyProviders';

const STALE_MS = 60 * 60 * 1000;

function toCurrencyRates(
    rates: NonNullable<
        ReturnType<typeof cachedCurrencyRatesSchema.safeParse>['data']
    >,
): CurrencyRates {
    return { base: rates.base, date: rates.date, rates: rates.rates };
}

export async function getCurrencyRates(
    supabaseAdmin: SupabaseClient,
    base: string,
): Promise<{ rates: CurrencyRates; cacheStatus: 'HIT' | 'MISS' | 'STALE' }> {
    const normalizedBase = base.toUpperCase();
    const { data: cached } = await supabaseAdmin
        .from('currency_rates')
        .select('base, date, rates, fetched_at')
        .eq('base', normalizedBase)
        .single();

    const cachedRates = cachedCurrencyRatesSchema.safeParse(cached);
    if (
        cachedRates.success &&
        Date.now() - new Date(cachedRates.data.fetched_at).getTime() < STALE_MS
    ) {
        return { rates: toCurrencyRates(cachedRates.data), cacheStatus: 'HIT' };
    }

    try {
        const rates = await fetchCurrencyRatesFromProviders(normalizedBase);
        void supabaseAdmin.from('currency_rates').upsert(
            {
                base: rates.base,
                date: rates.date,
                rates: rates.rates,
                fetched_at: new Date().toISOString(),
            },
            { onConflict: 'base' },
        );
        return { rates, cacheStatus: 'MISS' };
    } catch (err) {
        if (cachedRates.success) {
            return {
                rates: toCurrencyRates(cachedRates.data),
                cacheStatus: 'STALE',
            };
        }
        throw err;
    }
}
