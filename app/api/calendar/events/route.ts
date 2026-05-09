import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

const querySchema = z.object({
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
});

export async function GET(req: Request): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const { data: tokenRow } = await supabaseAdmin
        .from('user_tokens')
        .select('has_calendar')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!tokenRow?.has_calendar) {
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

    const tokens = await getGoogleTokens(supabaseAdmin, user.id);
    const auth = createGmailClient(tokens);
    auth.on('tokens', (fresh) => {
        if (fresh.access_token) {
            void supabaseAdmin
                .from('user_tokens')
                .update({
                    access_token: fresh.access_token,
                    expires_at: fresh.expiry_date ?? Date.now() + 3590 * 1000,
                })
                .eq('user_id', user.id);
        }
    });
    await auth.getAccessToken();

    const calendar = google.calendar({ version: 'v3', auth });
    const { data } = await calendar.events.list({
        calendarId: 'primary',
        timeMin: parsed.data.start,
        timeMax: parsed.data.end,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        fields: 'items(id,summary,description,location,start,end,htmlLink,hangoutLink,colorId)',
    });

    const events: CalendarEvent[] = (data.items ?? []).map((e) => ({
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
    }));

    return NextResponse.json({ events });
}
