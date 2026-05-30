import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listActivityEvents } from '@/features/activity/services/activityService';
import type {
    ActivityEventSource,
    ActivityEventCategory,
} from '@/features/activity/types/activity';

// GET /api/activity/feed.json
// Machine-readable activity feed for external automation and debugging.
// Authenticated users only — no public access.
// Sensitive metadata fields are excluded from the response.
export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(
            parseInt(searchParams.get('limit') ?? '50', 10),
            100,
        );
        const source = searchParams.get('source') as ActivityEventSource | null;
        const category = searchParams.get(
            'category',
        ) as ActivityEventCategory | null;

        const events = await listActivityEvents(supabase, userId, {
            limit,
            archived: false,
            ...(source ? { source } : {}),
            ...(category ? { category } : {}),
        });

        // Strip internal/sensitive metadata fields from the public feed
        const feed = events.map((e) => ({
            id: e.id,
            source: e.source,
            eventType: e.eventType,
            category: e.category,
            priority: e.priority,
            severity: e.severity,
            title: e.title,
            body: e.body,
            isRead: !!e.readAt,
            occurredAt: e.occurredAt,
            actionUrl: e.actionUrl,
            relatedEntities: e.relatedEntities,
        }));

        return NextResponse.json(
            {
                feed,
                count: feed.length,
                generatedAt: new Date().toISOString(),
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, no-store',
                },
            },
        );
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({
                feed: [],
                count: 0,
                generatedAt: new Date().toISOString(),
            });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
