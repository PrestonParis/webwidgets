import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listGoals,
    upsertGoal,
} from '@/features/tracking/services/goalService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

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

        const { category, targetType, targetValue } = body.data;
        const goalId = (goal as { id?: string }).id;
        const formatted = category
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'tracking',
            eventType: 'tracking.goal_created',
            sourceId: goalId,
            sourceTable: 'tracking_goals',
            category: 'data',
            severity: 'info',
            priority: 'normal',
            title: `Tracking goal set: ${formatted}`,
            body: `Target: ${targetValue} (${targetType.replace(/_/g, ' ')})`,
            actionUrl: '/tracking',
            metadata: {
                category,
                targetType,
                targetValue,
                metricKey: body.data.metricKey,
            },
        });

        return NextResponse.json({ goal });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
