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
import { registry } from '@/lib/observability/metrics';

const querySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ML_TYPES = [
    ANALYTICS_EVENTS.ML_PREDICTION_CREATED,
    ANALYTICS_EVENTS.ML_PREDICTION_LOW_CONFIDENCE,
    ANALYTICS_EVENTS.ML_PREDICTION_CORRECTED,
    ANALYTICS_EVENTS.ML_FALLBACK_USED,
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
        countEventsByType(admin, { from, to }, ML_TYPES),
        countEventsByDay(
            admin,
            { from, to },
            ANALYTICS_EVENTS.ML_PREDICTION_CREATED,
        ),
    ]);

    const get = (t: string) => byType.find((r) => r.type === t)?.count ?? 0;

    const total = get(ANALYTICS_EVENTS.ML_PREDICTION_CREATED);
    const lowConf = get(ANALYTICS_EVENTS.ML_PREDICTION_LOW_CONFIDENCE);
    const fallback = get(ANALYTICS_EVENTS.ML_FALLBACK_USED);
    const correction = get(ANALYTICS_EVENTS.ML_PREDICTION_CORRECTED);

    // Pull Prometheus latency metrics if available
    let avgLatencyMs = 0;
    try {
        const metricsText = await registry.metrics();
        const match = metricsText.match(
            /dashboard_ml_inference_duration_seconds_sum\s+([\d.]+)/,
        );
        const countMatch = metricsText.match(
            /dashboard_ml_inference_duration_seconds_count\s+([\d.]+)/,
        );
        if (match?.[1] && countMatch?.[1]) {
            const sum = parseFloat(match[1]);
            const cnt = parseFloat(countMatch[1]);
            if (cnt > 0) avgLatencyMs = +((sum / cnt) * 1000).toFixed(1);
        }
    } catch {
        /* prom metrics optional */
    }

    const rows = [
        {
            task: 'all',
            predictions: total,
            avgConfidence: 0,
            lowConfRate: total > 0 ? +((lowConf / total) * 100).toFixed(1) : 0,
            fallbackRate:
                total > 0 ? +((fallback / total) * 100).toFixed(1) : 0,
            correctionRate:
                total > 0 ? +((correction / total) * 100).toFixed(1) : 0,
            avgLatencyMs,
        },
    ];

    return NextResponse.json({ rows, series });
}
