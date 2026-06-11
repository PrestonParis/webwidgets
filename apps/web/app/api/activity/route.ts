import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    listActivityEvents,
    publishActivityEvent,
} from '@/features/activity/services/activityService';
import type {
    ActivityEventSource,
    ActivityEventCategory,
    ActivityEventPriority,
    ActivityEventInput,
} from '@/features/activity/types/activity';

export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(
            parseInt(searchParams.get('limit') ?? '50', 10),
            200,
        );
        const offset = parseInt(searchParams.get('offset') ?? '0', 10);
        const source = searchParams.get('source') as ActivityEventSource | null;
        const category = searchParams.get(
            'category',
        ) as ActivityEventCategory | null;
        const priority = searchParams.get(
            'priority',
        ) as ActivityEventPriority | null;
        const eventType = searchParams.get('event_type');
        const since = searchParams.get('since');
        const until = searchParams.get('until');
        const sourceId = searchParams.get('source_id');
        const sourceTable = searchParams.get('source_table');
        const archivedParam = searchParams.get('archived');
        const unreadOnly = searchParams.get('unread_only') === 'true';
        const search = searchParams.get('search') ?? undefined;

        const archived =
            archivedParam === 'true'
                ? true
                : archivedParam === 'false'
                  ? false
                  : undefined;

        const events = await listActivityEvents(supabase, userId, {
            limit,
            offset,
            ...(source ? { source } : {}),
            ...(category ? { category } : {}),
            ...(priority ? { priority } : {}),
            ...(eventType ? { eventType } : {}),
            ...(since ? { since } : {}),
            ...(until ? { until } : {}),
            ...(sourceId ? { sourceId } : {}),
            ...(sourceTable ? { sourceTable } : {}),
            ...(archived !== undefined ? { archived } : {}),
            unreadOnly,
            ...(search ? { search } : {}),
        });

        return NextResponse.json({ events });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err)) return NextResponse.json({ events: [] });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as Partial<ActivityEventInput>;

        if (!body.source || !body.title) {
            return NextResponse.json(
                { error: 'MISSING_FIELDS', required: ['source', 'title'] },
                { status: 400 },
            );
        }

        const event = await publishActivityEvent(supabase, {
            userId,
            source: body.source,
            title: body.title,
            ...(body.eventType ? { eventType: body.eventType } : {}),
            ...(body.sourceId ? { sourceId: body.sourceId } : {}),
            ...(body.sourceTable ? { sourceTable: body.sourceTable } : {}),
            ...(body.severity ? { severity: body.severity } : {}),
            ...(body.priority ? { priority: body.priority } : {}),
            ...(body.category ? { category: body.category } : {}),
            ...(body.body ? { body: body.body } : {}),
            ...(body.occurredAt ? { occurredAt: body.occurredAt } : {}),
            ...(body.relatedEntities
                ? { relatedEntities: body.relatedEntities }
                : {}),
            ...(body.metadata ? { metadata: body.metadata } : {}),
            ...(body.actionUrl ? { actionUrl: body.actionUrl } : {}),
        });

        return NextResponse.json({ event }, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json(
                { error: 'TABLE_NOT_FOUND' },
                { status: 503 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
