import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';

const querySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function percentile(sorted: number[], pct: number): number {
    if (sorted.length === 0) return 0;
    const i = Math.ceil((pct / 100) * sorted.length) - 1;
    return +sorted[Math.min(i, sorted.length - 1)]!.toFixed(1);
}

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

    const { data } = await admin
        .from('performance_events')
        .select('duration_ms, route, created_at')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at');

    const durations = (data ?? [])
        .map((r) => r.duration_ms as number)
        .sort((a, b) => a - b);

    const seriesMap = new Map<
        string,
        { date: string; sum: number; count: number }
    >();
    for (const row of data ?? []) {
        const day = (row.created_at as string).slice(0, 10);
        const e = seriesMap.get(day) ?? { date: day, sum: 0, count: 0 };
        e.sum += row.duration_ms as number;
        e.count += 1;
        seriesMap.set(day, e);
    }
    const series = Array.from(seriesMap.values())
        .map(({ date, sum, count }) => ({
            date,
            value: +(sum / count).toFixed(1),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
        p50: percentile(durations, 50),
        p95: percentile(durations, 95),
        p99: percentile(durations, 99),
        series,
    });
}
