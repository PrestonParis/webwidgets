import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    deleteWatchlistItem,
    updateWatchlistItem,
} from '@/features/finance/services/watchlistService';
import type { SupabaseClient } from '@supabase/supabase-js';

const patchSchema = z.object({
    assetType: z
        .enum([
            'stock',
            'crypto',
            'etf',
            'index',
            'other',
            'real_estate',
            'custom',
        ])
        .optional(),
    symbol: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    currency: z.string().min(3).max(3).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = patchSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const item = await updateWatchlistItem(
            supabase as unknown as SupabaseClient,
            userId,
            id,
            body.data as unknown as Parameters<typeof updateWatchlistItem>[3],
        );
        return NextResponse.json({ item });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        await deleteWatchlistItem(
            supabase as unknown as SupabaseClient,
            userId,
            id,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
