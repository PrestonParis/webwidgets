import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    listWatchlistItems,
    addWatchlistItem,
} from '@/features/finance/services/watchlistService';
import type { SupabaseClient } from '@supabase/supabase-js';

const addSchema = z.object({
    assetType: z.enum([
        'stock',
        'crypto',
        'etf',
        'index',
        'other',
        'real_estate',
        'custom',
    ]),
    symbol: z.string().min(1),
    displayName: z.string().min(1),
    currency: z.string().default('USD'),
    config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const items = await listWatchlistItems(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ items });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = addSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const item = await addWatchlistItem(
            supabase as unknown as SupabaseClient,
            userId,
            body.data as Parameters<typeof addWatchlistItem>[2],
        );
        return NextResponse.json({ item });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
