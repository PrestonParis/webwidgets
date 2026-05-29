import { google } from 'googleapis';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { ProviderError } from '@/lib/connectors/providerError';

export const calendarEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    location: z.string().optional(),
    description: z.string().optional(),
    calendarId: z.string().optional(),
    htmlLink: z.string().optional(),
    status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

async function buildCalendarClient(
    supabaseAdmin: SupabaseClient,
    userId: string,
) {
    const { data: tokenRow } = await supabaseAdmin
        .from('user_tokens')
        .select('has_calendar')
        .eq('user_id', userId)
        .maybeSingle();

    if (!tokenRow?.has_calendar) {
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'Google Calendar not connected',
        );
    }

    const tokens = await getGoogleTokens(supabaseAdmin, userId);
    const auth = createGmailClient(tokens);
    return google.calendar({ version: 'v3', auth });
}

function eventStart(e: {
    start?: { dateTime?: string | null; date?: string | null } | null;
}): string {
    return e.start?.dateTime ?? e.start?.date ?? '';
}

function eventEnd(e: {
    end?: { dateTime?: string | null; date?: string | null } | null;
}): string {
    return e.end?.dateTime ?? e.end?.date ?? '';
}

export async function fetchUpcomingEvents(
    supabaseAdmin: SupabaseClient,
    userId: string,
    daysAhead = 7,
    maxResults = 20,
): Promise<CalendarEvent[]> {
    const calendar = await buildCalendarClient(supabaseAdmin, userId);

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + daysAhead * 86_400_000).toISOString();

    const res = await calendar.events
        .list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        })
        .catch(() => {
            throw new ProviderError(
                'PROVIDER_UNAVAILABLE',
                'Google Calendar unavailable',
            );
        });

    return (res.data.items ?? []).map((e) =>
        calendarEventSchema.parse({
            id: e.id ?? crypto.randomUUID(),
            title: e.summary ?? '(no title)',
            start: eventStart(e),
            end: eventEnd(e),
            allDay: !e.start?.dateTime,
            location: e.location ?? undefined,
            description: e.description ?? undefined,
            htmlLink: e.htmlLink ?? undefined,
            status: (e.status as CalendarEvent['status']) ?? 'confirmed',
        }),
    );
}
