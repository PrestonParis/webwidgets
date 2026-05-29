import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchUpcomingEvents } from '@/lib/connectors/google/calendarConnector';
import { fetchOutlookCalendarEvents } from '@/lib/connectors/microsoft/graphConnector';
import { getMicrosoftTokens } from '@/lib/supabase/getMicrosoftTokens';
import { isNotConfigured } from '@/lib/connectors/providerError';
import type {
    CalendarSnapshot,
    NormalizedEvent,
} from '@/features/calendar/lib/calendarSchemas';

async function getGoogleEvents(
    supabaseAdmin: SupabaseClient,
    userId: string,
    daysAhead: number,
): Promise<{ events: NormalizedEvent[]; connected: boolean }> {
    try {
        const raw = await fetchUpcomingEvents(supabaseAdmin, userId, daysAhead);
        return {
            events: raw.map((e) => ({
                id: e.id,
                provider: 'google' as const,
                title: e.title,
                start: e.start,
                end: e.end,
                allDay: e.allDay,
                location: e.location,
                description: e.description,
                htmlLink: e.htmlLink,
                status: e.status,
            })),
            connected: true,
        };
    } catch (err) {
        if (isNotConfigured(err)) return { events: [], connected: false };
        throw err;
    }
}

async function getOutlookEvents(
    supabaseAdmin: SupabaseClient,
    userId: string,
    daysAhead: number,
): Promise<{ events: NormalizedEvent[]; connected: boolean }> {
    try {
        const tokens = await getMicrosoftTokens(supabaseAdmin, userId);
        const raw = await fetchOutlookCalendarEvents(tokens, daysAhead);
        return {
            events: raw.map((e) => ({
                id: e.id,
                provider: 'outlook' as const,
                title: e.subject ?? '(no title)',
                start: e.start.dateTime,
                end: e.end.dateTime,
                allDay: e.isAllDay,
                location: e.location?.displayName,
                description: undefined,
                htmlLink: e.webLink,
                status:
                    e.showAs === 'free'
                        ? ('confirmed' as const)
                        : ('confirmed' as const),
            })),
            connected: true,
        };
    } catch (err) {
        if (isNotConfigured(err)) return { events: [], connected: false };
        throw err;
    }
}

export async function getCalendarSnapshot(
    supabaseAdmin: SupabaseClient,
    userId: string,
    daysAhead = 7,
): Promise<CalendarSnapshot> {
    const [google, outlook] = await Promise.all([
        getGoogleEvents(supabaseAdmin, userId, daysAhead),
        getOutlookEvents(supabaseAdmin, userId, daysAhead),
    ]);

    const connectedProviders: string[] = [
        ...(google.connected ? ['google'] : []),
        ...(outlook.connected ? ['outlook'] : []),
    ];

    const events = [...google.events, ...outlook.events].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    return { events, connectedProviders, windowDays: daysAhead };
}
