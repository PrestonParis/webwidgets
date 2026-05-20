import { NextRequest, NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getCurrencyRates } from '@/features/currency/server/currencyService';

export async function GET(req: NextRequest): Promise<Response> {
    const base = (req.nextUrl.searchParams.get('base') ?? 'USD').toUpperCase();
    const { supabaseAdmin } = await createClients();
    try {
        const { rates, cacheStatus } = await getCurrencyRates(
            supabaseAdmin,
            base,
        );
        return NextResponse.json(rates, {
            headers: { 'X-Cache': cacheStatus },
        });
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch currency rates' },
            { status: 502 },
        );
    }
}
