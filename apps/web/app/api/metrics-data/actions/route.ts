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

const ACTION_TYPES = [
    ANALYTICS_EVENTS.ACTION_SUGGESTED,
    ANALYTICS_EVENTS.ACTION_ACCEPTED,
    ANALYTICS_EVENTS.ACTION_REJECTED,
    ANALYTICS_EVENTS.ACTION_EXECUTED,
    ANALYTICS_EVENTS.ACTION_FAILED,
    ANALYTICS_EVENTS.ACTION_RETRIED,
];

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

    const [byType, series] = await Promise.all([
        countEventsByType(admin, { from, to }, ACTION_TYPES),
        countEventsByDay(admin, { from, to }, ANALYTICS_EVENTS.ACTION_EXECUTED),
    ]);

    const get = (t: string) => byType.find((r) => r.type === t)?.count ?? 0;

    const suggested = get(ANALYTICS_EVENTS.ACTION_SUGGESTED);
    const accepted = get(ANALYTICS_EVENTS.ACTION_ACCEPTED);
    const executed = get(ANALYTICS_EVENTS.ACTION_EXECUTED);
    const failed = get(ANALYTICS_EVENTS.ACTION_FAILED);

    const rows = [
        {
            type: 'all',
            suggested,
            accepted,
            rejected: get(ANALYTICS_EVENTS.ACTION_REJECTED),
            executed,
            failed,
            acceptanceRate:
                suggested > 0 ? +((accepted / suggested) * 100).toFixed(1) : 0,
            failureRate:
                executed > 0 ? +((failed / executed) * 100).toFixed(1) : 0,
        },
    ];

    return NextResponse.json({ rows, series });
}
