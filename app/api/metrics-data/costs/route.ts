import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';
import { countEventsByDay } from '@/features/analytics/analyticsQueries';
import { ANALYTICS_EVENTS } from '@/features/analytics/eventNames';

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

    const { data: costRows } = await admin
        .from('cost_events')
        .select('provider, feature, cost_usd')
        .gte('created_at', from)
        .lte('created_at', to);

    const summaryMap = new Map<
        string,
        { provider: string; feature: string; totalUsd: number; calls: number }
    >();
    for (const row of costRows ?? []) {
        const key = `${row.provider}::${row.feature}`;
        const existing = summaryMap.get(key) ?? {
            provider: row.provider as string,
            feature: row.feature as string,
            totalUsd: 0,
            calls: 0,
        };
        existing.totalUsd += (row.cost_usd as number | null) ?? 0;
        existing.calls += 1;
        summaryMap.set(key, existing);
    }

    const summaries = Array.from(summaryMap.values())
        .map((s) => ({ ...s, totalUsd: +s.totalUsd.toFixed(4) }))
        .sort((a, b) => b.totalUsd - a.totalUsd);

    const series = await countEventsByDay(
        admin,
        { from, to },
        ANALYTICS_EVENTS.ML_PREDICTION_CREATED,
    );

    return NextResponse.json({ summaries, series });
}
