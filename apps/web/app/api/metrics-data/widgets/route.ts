import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';
import {
    countEventsByDay,
    countEventsByType,
} from '@/features/analytics/lib/analyticsQueries';
import { ANALYTICS_EVENTS } from '@/features/analytics/lib/eventNames';

const querySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: Request) {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const p = querySchema.safeParse(
        Object.fromEntries(new URL(req.url).searchParams),
    );
    if (!p.success)
        return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const { from, to } = p.data;
    const admin = createAdminClient();

    const widgetTypes = [
        ANALYTICS_EVENTS.WIDGET_ADDED,
        ANALYTICS_EVENTS.WIDGET_REMOVED,
        ANALYTICS_EVENTS.WIDGET_HIDDEN,
        ANALYTICS_EVENTS.WIDGET_OPENED,
    ];

    const [byType, series] = await Promise.all([
        countEventsByType(admin, { from, to }, widgetTypes),
        countEventsByDay(admin, { from, to }, ANALYTICS_EVENTS.WIDGET_ADDED),
    ]);

    const get = (t: string) => byType.find((r) => r.type === t)?.count ?? 0;

    const rows = [
        {
            widgetType: 'all',
            usageCount: get(ANALYTICS_EVENTS.WIDGET_OPENED),
            activeUsers: 0,
            addCount: get(ANALYTICS_EVENTS.WIDGET_ADDED),
            hideCount: get(ANALYTICS_EVENTS.WIDGET_HIDDEN),
            removeCount: get(ANALYTICS_EVENTS.WIDGET_REMOVED),
            retentionRate: 0,
            avgRenderMs: 0,
            errorRate: 0,
        },
    ];

    return NextResponse.json({ rows, series });
}
