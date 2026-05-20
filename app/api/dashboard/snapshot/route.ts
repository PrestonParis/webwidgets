import { NextResponse } from 'next/server';
import { captureError } from '@/lib/observability/sentry';
import { createClients } from '@/lib/supabase/serverClient';
import { dashboardSnapshotRequestSchema } from '@/features/dashboard/schemas/dashboardSnapshotRequest';
import { getDashboardSnapshot } from '@/features/dashboard/server/getDashboardSnapshot';

async function requestUserId() {
    const { supabase } = await createClients();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
}

export async function POST(req: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    try {
        const body = dashboardSnapshotRequestSchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json(
                { error: 'Invalid dashboard snapshot request' },
                { status: 400 },
            );
        }

        const snapshot = await getDashboardSnapshot({
            requestId,
            userId: await requestUserId(),
            activeWidgets: body.data.widgets,
        });

        return NextResponse.json(snapshot);
    } catch (err) {
        captureError(err, {
            requestId,
            operation: 'dashboardSnapshotRoute',
            feature: 'dashboard',
        });
        return NextResponse.json(
            {
                error: {
                    code: 'SNAPSHOT_FAILED',
                    message: 'Dashboard data is temporarily unavailable.',
                },
            },
            { status: 500 },
        );
    }
}
