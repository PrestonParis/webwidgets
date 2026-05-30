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
    countActiveUsers,
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

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
        from: searchParams.get('from'),
        to: searchParams.get('to'),
    });
    if (!parsed.success)
        return NextResponse.json(
            { error: 'Invalid date range' },
            { status: 400 },
        );

    const { from, to } = parsed.data;
    const admin = createAdminClient();

    const [dauCount, widgetEvents, actionEvents, mlEvents, emailEvents] =
        await Promise.all([
            countActiveUsers(admin, { from, to }),
            countEventsByType(admin, { from, to }, [
                ANALYTICS_EVENTS.WIDGET_ADDED,
                ANALYTICS_EVENTS.WIDGET_OPENED,
            ]),
            countEventsByType(admin, { from, to }, [
                ANALYTICS_EVENTS.ACTION_SUGGESTED,
                ANALYTICS_EVENTS.ACTION_ACCEPTED,
                ANALYTICS_EVENTS.ACTION_FAILED,
            ]),
            countEventsByType(admin, { from, to }, [
                ANALYTICS_EVENTS.ML_PREDICTION_CREATED,
                ANALYTICS_EVENTS.ML_PREDICTION_LOW_CONFIDENCE,
            ]),
            countEventsByType(admin, { from, to }, [
                ANALYTICS_EVENTS.EMAIL_CLASSIFIED,
                ANALYTICS_EVENTS.EMAIL_ACTION_EXTRACTED,
                ANALYTICS_EVENTS.EMAIL_PROCESSING_FAILED,
            ]),
        ]);

    const byType = (types: string[], arr: typeof actionEvents) =>
        arr.find((r) => types.includes(r.type))?.count ?? 0;

    const [dauSeries, widgetSeries, actionSeries] = await Promise.all([
        countEventsByDay(admin, { from, to }),
        countEventsByDay(admin, { from, to }, ANALYTICS_EVENTS.WIDGET_ADDED),
        countEventsByDay(admin, { from, to }, ANALYTICS_EVENTS.ACTION_EXECUTED),
    ]);

    const mlTotal = mlEvents.reduce((s, r) => s + r.count, 0);
    const mlLowConf = byType(
        [ANALYTICS_EVENTS.ML_PREDICTION_LOW_CONFIDENCE],
        mlEvents,
    );

    return NextResponse.json({
        dau: dauCount,
        wau: 0,
        mau: 0,
        newUsers: 0,
        widgetsAdded: byType([ANALYTICS_EVENTS.WIDGET_ADDED], widgetEvents),
        widgetsOpened: byType([ANALYTICS_EVENTS.WIDGET_OPENED], widgetEvents),
        actionsSugg: byType([ANALYTICS_EVENTS.ACTION_SUGGESTED], actionEvents),
        actionsAccepted: byType(
            [ANALYTICS_EVENTS.ACTION_ACCEPTED],
            actionEvents,
        ),
        actionsFailed: byType([ANALYTICS_EVENTS.ACTION_FAILED], actionEvents),
        mlPredictions: mlTotal,
        mlLowConfRate:
            mlTotal > 0 ? +((mlLowConf / mlTotal) * 100).toFixed(1) : 0,
        emailProcessed:
            byType([ANALYTICS_EVENTS.EMAIL_CLASSIFIED], emailEvents) +
            byType([ANALYTICS_EVENTS.EMAIL_ACTION_EXTRACTED], emailEvents),
        queueFailures: byType(
            [ANALYTICS_EVENTS.EMAIL_PROCESSING_FAILED],
            emailEvents,
        ),
        frontendErrors: 0,
        apiErrors: 0,
        aiCostUsd: 0,
        series: {
            dau: dauSeries,
            widgets: widgetSeries,
            actions: actionSeries,
        },
    });
}
