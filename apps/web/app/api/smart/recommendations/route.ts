import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { recommendForUser } from '@/features/intelligence/services/smartRecommendationService';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        return NextResponse.json(await recommendForUser(supabase, userId));
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : 'Request failed',
            },
            { status: 500 },
        );
    }
}
