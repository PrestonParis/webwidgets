import { allDayOccurrence, providerHash } from './providerNormalize.js';
import { cleanGoogleValue, GoogleHttpError, googleJson } from './googleHttp.js';
import type { CalendarSignal } from './providerTypes.js';

const CALENDAR_API =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface GoogleCalendarEvent {
    id?: string;
    etag?: string;
    status?: string;
    updated?: string;
    summary?: string;
    location?: string;
    htmlLink?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
}

function normalizeCalendarEvent(
    event: GoogleCalendarEvent,
): CalendarSignal | null {
    const start =
        event.start?.dateTime ??
        event.start?.date ??
        (event.status === 'cancelled' ? event.updated : undefined);
    if (!event.id || !start) return null;
    const allDay = Boolean(event.start?.date && !event.start.dateTime);
    return {
        kind: 'calendar',
        provider: 'google_calendar',
        objectId: event.id,
        providerVersion:
            event.updated ?? event.etag ?? providerHash(JSON.stringify(event)),
        change: event.status === 'cancelled' ? 'cancelled' : 'upsert',
        title: cleanGoogleValue(event.summary, 500),
        start: allDay ? allDayOccurrence(start) : new Date(start).toISOString(),
        end: event.end?.dateTime
            ? new Date(event.end.dateTime).toISOString()
            : event.end?.date
              ? allDayOccurrence(event.end.date)
              : null,
        allDay,
        calendarId: 'primary',
        location: cleanGoogleValue(event.location, 500),
        webLink: cleanGoogleValue(event.htmlLink, 2_000),
    };
}

async function fetchCalendarPages(token: string, params: URLSearchParams) {
    const signals: CalendarSignal[] = [];
    let pageToken: string | undefined;
    let cursor: string | undefined;
    do {
        if (pageToken) params.set('pageToken', pageToken);
        else params.delete('pageToken');
        const page = await googleJson<{
            items?: GoogleCalendarEvent[];
            nextPageToken?: string;
            nextSyncToken?: string;
        }>(`${CALENDAR_API}?${params.toString()}`, token);
        signals.push(
            ...(page.items ?? [])
                .map(normalizeCalendarEvent)
                .filter((item) => item !== null),
        );
        pageToken = page.nextPageToken;
        cursor = page.nextSyncToken ?? cursor;
    } while (pageToken);
    return { signals, ...(cursor ? { cursor } : {}) };
}

export async function fetchGoogleCalendarSignals(
    token: string,
    cursor: string | undefined,
    limit: number,
): Promise<{ signals: CalendarSignal[]; cursor?: string }> {
    const params = new URLSearchParams({
        maxResults: String(limit),
        singleEvents: 'true',
        showDeleted: 'true',
    });
    if (cursor) params.set('syncToken', cursor);
    else {
        params.set(
            'timeMin',
            new Date(Date.now() - 30 * 86_400_000).toISOString(),
        );
        params.set(
            'timeMax',
            new Date(Date.now() + 365 * 86_400_000).toISOString(),
        );
    }
    try {
        return await fetchCalendarPages(token, params);
    } catch (error) {
        if (cursor && error instanceof GoogleHttpError && error.status === 410)
            return fetchGoogleCalendarSignals(token, undefined, limit);
        throw error;
    }
}
