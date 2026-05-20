import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    listGoals,
    upsertGoal,
} from '@/features/tracking/services/goalService';
import type { SupabaseClient } from '@supabase/supabase-js';

const upsertSchema = z.object({
    category: z.string().min(1),
    targetType: z.enum(['daily_min', 'weekly_count', 'daily_log']),
    metricKey: z.string().optional(),
    targetValue: z.number().positive(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const goals = await listGoals(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ goals });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = upsertSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const goal = await upsertGoal(
            supabase as unknown as SupabaseClient,
            userId,
            body.data as unknown as Omit<
                import('@/features/tracking/types/goals').TrackingGoal,
                'id' | 'userId' | 'createdAt'
            >,
        );
        return NextResponse.json({ goal });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
