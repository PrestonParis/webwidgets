import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listWatchlistItems,
    addWatchlistReading,
} from '@/features/finance/services/watchlistService';
import { fetchLatestValue } from '@/features/finance/lib/watchlist/watchlistProviderRegistry';

const STALE_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const items = await listWatchlistItems(supabase, userId);
        const item = items.find((i) => i.id === id);
        if (!item)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Return cached reading if fresh
        if (item.latest) {
            const age = Date.now() - new Date(item.latest.fetchedAt).getTime();
            if (age < STALE_MS)
                return NextResponse.json({
                    reading: item.latest,
                    cached: true,
                });
        }

        const result = await fetchLatestValue(item);

        if (result.needsManual || result.value === null) {
            return NextResponse.json({ needsManual: true, item });
        }

        const reading = await addWatchlistReading(
            supabase,
            userId,
            id,
            result.value,
            result.source,
            result.metadata,
        );

        return NextResponse.json({ reading, cached: false });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
