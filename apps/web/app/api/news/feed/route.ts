import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { parseTimelineQuery } from '@/features/news/schemas/timelineFeedSchemas';
import { queryTimelineFeed } from '@/features/news/server/timelineFeedServer';
import { createClients } from '@/lib/supabase/serverClient';

export async function GET(request: Request) {
    try {
        const filters = parseTimelineQuery(new URL(request.url));
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json(
            await queryTimelineFeed(supabase, userId, filters),
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (error instanceof ZodError || message === 'BAD_CURSOR')
            return NextResponse.json(
                { error: 'Invalid timeline query' },
                { status: 400 },
            );
        if (message === 'Unauthorized')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        return NextResponse.json(
            { error: 'Unable to load timeline' },
            { status: 500 },
        );
    }
}
