import { NextResponse } from 'next/server';
import { captureError } from '@/lib/observability/sentry';
import { createClients } from '@/lib/supabase/serverClient';
import { dashboardSnapshotRequestSchema } from '@/features/dashboard/schemas/dashboardSnapshotRequest';
import { getDashboardSnapshot } from '@/features/dashboard/server/getDashboardSnapshot';

const ROUTE_CACHE_TTL_MS = 5_000;
const routeCache = new Map<string, { expiresAt: number; value: unknown }>();
const routeInflight = new Map<string, Promise<unknown>>();

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

        const userId = await requestUserId();
        const cacheKey = JSON.stringify({
            userId: userId ?? null,
            widgets: body.data.widgets?.map((w) => `${w.id}:${w.type}`) ?? [],
        });
        const cached = routeCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return NextResponse.json(cached.value);
        }

        const existing = routeInflight.get(cacheKey);
        const promise =
            existing ??
            getDashboardSnapshot({
                requestId,
                ...(userId !== undefined ? { userId } : {}),
                ...(body.data.widgets !== undefined
                    ? { activeWidgets: body.data.widgets }
                    : {}),
            } as Parameters<typeof getDashboardSnapshot>[0]).finally(() =>
                routeInflight.delete(cacheKey),
            );
        if (!existing) routeInflight.set(cacheKey, promise);
        const snapshot = await promise;
        routeCache.set(cacheKey, {
            value: snapshot,
            expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
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
