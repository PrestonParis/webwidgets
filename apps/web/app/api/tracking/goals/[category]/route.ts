import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { deleteGoal } from '@/features/tracking/services/goalService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ category: string }> },
) {
    try {
        const { category } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const decoded = decodeURIComponent(category);

        await deleteGoal(supabase, userId, decoded);

        const formatted = decoded
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'tracking',
            eventType: 'tracking.goal_updated',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: `Tracking goal removed: ${formatted}`,
            actionUrl: '/tracking',
            metadata: { trackingCategory: decoded },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
