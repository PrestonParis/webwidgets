import { currencyRatesSchema } from '@/lib/connectors/currencyProviders';
import { createClients } from '@/lib/supabase/serverClient';
import { getCurrencyRates } from '@/features/currency/server/currencyService';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const currencyResolvers: DataResolver[] = [
    {
        key: 'currency.rates.usd',
        cachePolicy: { ttlSeconds: 1800, staleWhileRevalidateSeconds: 3600 },
        schema: currencyRatesSchema,
        async resolve() {
            const { supabaseAdmin } = await createClients();
            const { rates } = await getCurrencyRates(supabaseAdmin, 'USD');
            return rates;
        },
    },
];
