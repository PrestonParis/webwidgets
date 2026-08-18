import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    addRssSource,
    listRssSources,
} from '@/features/integrations/services/rssSourceServer';
import { createClients } from '@/lib/supabase/serverClient';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json({
            sources: await listRssSources(supabase, userId),
        });
    } catch {
        return NextResponse.json(
            { error: 'Unable to list RSS sources' },
            { status: 401 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const source = await addRssSource(
            supabase,
            userId,
            await request.json(),
        );
        return NextResponse.json({ source }, { status: 201 });
    } catch (error) {
        const invalid =
            error instanceof ZodError ||
            (error instanceof Error && error.message === 'UNSAFE_FEED_URL');
        return NextResponse.json(
            {
                error: invalid
                    ? 'Invalid or unsafe feed URL'
                    : 'Unable to add RSS source',
            },
            { status: invalid ? 400 : 500 },
        );
    }
}
