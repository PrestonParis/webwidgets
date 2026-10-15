import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listWatchlistReadings,
    addWatchlistReading,
} from '@/features/finance/services/watchlistService';

const addSchema = z.object({
    value: z.number(),
    source: z.string().default('manual'),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const readings = await listWatchlistReadings(supabase, userId, id);
        return NextResponse.json({ readings });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = addSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const reading = await addWatchlistReading(
            supabase,
            userId,
            id,
            body.data.value,
            body.data.source,
            body.data.metadata ?? {},
        );
        return NextResponse.json({ reading });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
