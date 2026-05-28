import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';
import { fetchRecentEvents } from '@/features/analytics/analyticsQueries';

const querySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: Request) {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const { from, to, type, limit, offset } = parsed.data;
    const admin = createAdminClient();

    const { events, error } = await fetchRecentEvents(
        admin,
        { from, to },
        {
            ...(type !== undefined ? { type } : {}),
            limit,
            offset,
        },
    );

    if (error)
        return NextResponse.json({ error: 'Query failed' }, { status: 500 });

    // Mask user_id to partial UUID — never expose full identifiers
    const masked = events.map((e) => ({
        id: e.id,
        userId: e.user_id ? e.user_id.slice(0, 8) + '…' : null,
        type: e.type,
        source: e.source,
        metadata: e.metadata ?? null,
        createdAt: e.created_at,
    }));

    return NextResponse.json({ events: masked, total: masked.length });
}
