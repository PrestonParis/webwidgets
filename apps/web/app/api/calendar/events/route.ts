import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { calendar_v3 } from 'googleapis';
import type { CalendarEvent } from '@/features/calendar/types/calendar';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import { ingestCalendarEventContext } from '@/features/context/services/contextProducerService';
import { markContextStatus } from '@/features/context/services/contextService';

type CalEventsResource = {
    insert(
        params: calendar_v3.Params$Resource$Events$Insert,
    ): Promise<{ data: calendar_v3.Schema$Event }>;
    patch(
        params: calendar_v3.Params$Resource$Events$Patch,
    ): Promise<{ data: calendar_v3.Schema$Event }>;
};
// Cast events resource to avoid ambiguous union return types from googleapis overloads.
function calEvents(cal: ReturnType<typeof google.calendar>): CalEventsResource {
    return cal.events as unknown as CalEventsResource;
}

// ─── shared helpers ───────────────────────────────────────────────────────────

async function requireCalendar(
    supabaseAdmin: SupabaseClient,
    userId: string,
): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from('user_tokens')
        .select('has_calendar')
        .eq('user_id', userId)
        .maybeSingle();
    return Boolean(data?.has_calendar);
}

async function buildCalendarClient(
    supabaseAdmin: SupabaseClient,
    userId: string,
) {
    const tokens = await getGoogleTokens(supabaseAdmin, userId);
    const auth = createGmailClient(tokens);
    auth.on('tokens', (fresh) => {
        if (fresh.access_token) {
            void supabaseAdmin
                .from('user_tokens')
                .update({
                    access_token: fresh.access_token,
                    expires_at: fresh.expiry_date ?? Date.now() + 3590 * 1000,
                })
                .eq('user_id', userId);
        }
    });
    await auth.getAccessToken();
    return google.calendar({ version: 'v3', auth });
}

function mapEvent(e: {
    id?: string | null;
    summary?: string | null;
    description?: string | null;
    location?: string | null;
    start?: {
        dateTime?: string | null;
        date?: string | null;
        timeZone?: string | null;
    } | null;
    end?: {
        dateTime?: string | null;
        date?: string | null;
        timeZone?: string | null;
    } | null;
    htmlLink?: string | null;
    hangoutLink?: string | null;
    colorId?: string | null;
}): CalendarEvent {
    return {
        id: e.id ?? '',
        summary: e.summary ?? '(No title)',
        description: e.description ?? null,
        location: e.location ?? null,
        start: {
            ...(e.start?.dateTime ? { dateTime: e.start.dateTime } : {}),
            ...(e.start?.date ? { date: e.start.date } : {}),
            ...(e.start?.timeZone ? { timeZone: e.start.timeZone } : {}),
        },
        end: {
            ...(e.end?.dateTime ? { dateTime: e.end.dateTime } : {}),
            ...(e.end?.date ? { date: e.end.date } : {}),
            ...(e.end?.timeZone ? { timeZone: e.end.timeZone } : {}),
        },
        htmlLink: e.htmlLink ?? '',
        ...(e.hangoutLink ? { hangoutLink: e.hangoutLink } : {}),
        ...(e.colorId ? { colorId: e.colorId } : {}),
    };
}

// ─── GET — list events ────────────────────────────────────────────────────────

const querySchema = z.object({
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
});

export async function GET(req: Request): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    if (!(await requireCalendar(supabaseAdmin, user.id))) {
        return NextResponse.json(
            { error: 'calendar_not_connected' },
            { status: 403 },
        );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
        start: searchParams.get('start'),
        end: searchParams.get('end'),
    });
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid date range' },
            { status: 400 },
        );
    }

    const calendar = await buildCalendarClient(supabaseAdmin, user.id);
    const { data } = await calendar.events.list({
        calendarId: 'primary',
        timeMin: parsed.data.start,
        timeMax: parsed.data.end,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        fields: 'items(id,summary,description,location,start,end,htmlLink,hangoutLink,colorId)',
    });

    return NextResponse.json({
        events: (data.items ?? []).map(mapEvent),
    });
}

// ─── POST — create event ──────────────────────────────────────────────────────

const eventTimeSchema = z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
});

const createSchema = z.object({
    summary: z.string().min(1),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    start: eventTimeSchema,
    end: eventTimeSchema,
    colorId: z.string().nullable().optional(),
});

export async function POST(req: Request): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    if (!(await requireCalendar(supabaseAdmin, user.id))) {
        return NextResponse.json(
            { error: 'calendar_not_connected' },
            { status: 403 },
        );
    }

    const body = createSchema.safeParse(await req.json());
    if (!body.success) {
        return NextResponse.json(
            { error: 'Invalid event data' },
            { status: 400 },
        );
    }

    const { summary, description, location, start, end, colorId } = body.data;
    const calendar = await buildCalendarClient(supabaseAdmin, user.id);

    const { data } = await calEvents(calendar).insert({
        calendarId: 'primary',
        requestBody: {
            summary,
            ...(description != null ? { description } : {}),
            ...(location != null ? { location } : {}),
            start: start as calendar_v3.Schema$EventDateTime,
            end: end as calendar_v3.Schema$EventDateTime,
            ...(colorId ? { colorId } : {}),
        },
    });

    const created = mapEvent(data);
    const startLabel =
        created.start.dateTime?.slice(0, 16).replace('T', ' ') ??
        created.start.date ??
        '';
    await publishActivityEventSafe(supabase, {
        userId: user.id,
        source: 'calendar',
        eventType: 'calendar.event_created',
        sourceId: created.id,
        category: 'data',
        severity: 'info',
        priority: 'normal',
        title: `Calendar event created: ${created.summary}`,
        body: startLabel || undefined,
        actionUrl: created.htmlLink,
        metadata: {
            eventId: created.id,
            summary: created.summary,
            start: startLabel,
        },
    });
    await ingestCalendarEventContext(supabase, user.id, {
        id: created.id,
        summary: created.summary,
        description: created.description,
        start: created.start.dateTime ?? created.start.date,
        end: created.end.dateTime ?? created.end.date,
        htmlLink: created.htmlLink,
        createdByType: 'user',
    }).catch(() => undefined);

    return NextResponse.json(created, { status: 201 });
}

// ─── PATCH — update event ─────────────────────────────────────────────────────

const updateSchema = z.object({
    eventId: z.string().min(1),
    summary: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    start: eventTimeSchema.optional(),
    end: eventTimeSchema.optional(),
    colorId: z.string().nullable().optional(),
});

const GOOGLE_CALENDAR_COLOR_IDS = new Set(
    Array.from({ length: 11 }, (_, index) => String(index + 1)),
);

export async function PATCH(req: Request): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    if (!(await requireCalendar(supabaseAdmin, user.id))) {
        return NextResponse.json(
            { error: 'calendar_not_connected' },
            { status: 403 },
        );
    }

    const body = updateSchema.safeParse(await req.json());
    if (!body.success) {
        return NextResponse.json(
            { error: 'Invalid event data' },
            { status: 400 },
        );
    }

    const { eventId, summary, description, location, start, end, colorId } =
        body.data;
    const calendar = await buildCalendarClient(supabaseAdmin, user.id);

    const patchBody: calendar_v3.Schema$Event = {
        ...(summary !== undefined ? { summary } : {}),
        ...(description !== undefined
            ? { description: description ?? '' }
            : {}),
        ...(location !== undefined ? { location: location ?? '' } : {}),
        ...(start !== undefined
            ? { start: start as calendar_v3.Schema$EventDateTime }
            : {}),
        ...(end !== undefined
            ? { end: end as calendar_v3.Schema$EventDateTime }
            : {}),
        ...(colorId && GOOGLE_CALENDAR_COLOR_IDS.has(colorId)
            ? { colorId }
            : {}),
    };
    const { data } = await calEvents(calendar).patch({
        calendarId: 'primary',
        eventId,
        requestBody: patchBody,
    });

    const updated = mapEvent(data);
    await publishActivityEventSafe(supabase, {
        userId: user.id,
        source: 'calendar',
        eventType: 'calendar.event_updated',
        sourceId: eventId,
        category: 'data',
        severity: 'info',
        priority: 'low',
        title: `Calendar event updated: ${updated.summary}`,
        actionUrl: updated.htmlLink,
        metadata: { eventId, summary: updated.summary },
    });
    await ingestCalendarEventContext(supabase, user.id, {
        id: updated.id || eventId,
        summary: updated.summary,
        description: updated.description,
        start: updated.start.dateTime ?? updated.start.date,
        end: updated.end.dateTime ?? updated.end.date,
        htmlLink: updated.htmlLink,
        createdByType: 'user',
    }).catch(() => undefined);

    return NextResponse.json(updated);
}

// ─── DELETE — remove event ────────────────────────────────────────────────────

export async function DELETE(req: Request): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    if (!(await requireCalendar(supabaseAdmin, user.id))) {
        return NextResponse.json(
            { error: 'calendar_not_connected' },
            { status: 403 },
        );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
        return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const calendar = await buildCalendarClient(supabaseAdmin, user.id);
    await calendar.events.delete({ calendarId: 'primary', eventId });

    await publishActivityEventSafe(supabase, {
        userId: user.id,
        source: 'calendar',
        eventType: 'calendar.event_deleted',
        sourceId: eventId,
        category: 'data',
        severity: 'info',
        priority: 'low',
        title: 'Calendar event deleted',
        metadata: { eventId },
    });
    await markContextStatus(
        supabase,
        user.id,
        `calendar_event:${eventId}`,
        'deleted',
    ).catch(() => undefined);

    return new Response(null, { status: 204 });
}
