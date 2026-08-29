import { z } from 'zod';
import type { CalendarActionPayload, CalendarActionReceipt } from './contracts';
import {
    GoogleCalendarActionError,
    type GoogleCalendarTransport,
} from './googleCalendarTransport';

const providerEvent = z.object({
    id: z.string().min(1),
    summary: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    htmlLink: z.url(),
    status: z.string(),
    attendees: z.array(z.object({ email: z.email() })).default([]),
    start: z.object({
        date: z.string().optional(),
        dateTime: z.string().optional(),
        timeZone: z.string().optional(),
    }),
    end: z.object({
        date: z.string().optional(),
        dateTime: z.string().optional(),
        timeZone: z.string().optional(),
    }),
    extendedProperties: z
        .object({ private: z.record(z.string(), z.string()).optional() })
        .optional(),
});
export function calendarProviderEventId(requestId: string) {
    return `ww${z.uuid().parse(requestId).replaceAll('-', '')}`;
}
function eventBody(requestId: string, event: CalendarActionPayload) {
    return {
        summary: event.title,
        description: event.description ?? '',
        location: event.location ?? '',
        attendees: event.attendees.map((email) => ({ email })),
        start: event.allDay
            ? { date: event.startDate }
            : { dateTime: event.startsAt, timeZone: event.timezone },
        end: event.allDay
            ? { date: event.endDate }
            : { dateTime: event.endsAt, timeZone: event.timezone },
        extendedProperties: { private: { webwidgetsRequestId: requestId } },
    };
}
function verified(
    event: z.infer<typeof providerEvent>,
    input: CalendarActionPayload,
    requestId: string,
) {
    const actual = [
        ...event.attendees.map((item) => item.email.toLowerCase()),
    ].sort();
    const expected = [
        ...input.attendees.map((item) => item.toLowerCase()),
    ].sort();
    const times = input.allDay
        ? event.start.date === input.startDate &&
          event.end.date === input.endDate
        : event.start.dateTime === input.startsAt &&
          event.end.dateTime === input.endsAt &&
          event.start.timeZone === input.timezone;
    return (
        event.summary === input.title &&
        (event.description ?? '') === (input.description ?? '') &&
        (event.location ?? '') === (input.location ?? '') &&
        times &&
        JSON.stringify(actual) === JSON.stringify(expected) &&
        event.extendedProperties?.private?.webwidgetsRequestId === requestId
    );
}
export async function executeCalendarCreate(
    transport: GoogleCalendarTransport,
    input: {
        requestId: string;
        event: CalendarActionPayload;
        dispatchAllowed: boolean;
    },
): Promise<CalendarActionReceipt> {
    const id = calendarProviderEventId(input.requestId);
    let writing = false;
    try {
        if (input.dispatchAllowed) {
            writing = true;
            try {
                await transport(
                    `calendars/primary/events/${id}?sendUpdates=all`,
                    {
                        method: 'PUT',
                        body: eventBody(input.requestId, input.event),
                    },
                );
            } catch (error) {
                if (
                    !(
                        error instanceof GoogleCalendarActionError &&
                        error.status === 409
                    )
                )
                    throw error;
            }
        }
        const data = providerEvent.parse(
            await transport(`calendars/primary/events/${id}`),
        );
        if (!verified(data, input.event, input.requestId))
            throw new Error('calendar_receipt_mismatch');
        return {
            state: 'verified',
            providerObjectId: id,
            htmlLink: data.htmlLink,
            start: data.start.dateTime ?? data.start.date ?? null,
            end: data.end.dateTime ?? data.end.date ?? null,
            code: 'calendar_event_verified',
        };
    } catch (error) {
        const rejected =
            writing &&
            error instanceof GoogleCalendarActionError &&
            error.status !== null &&
            [400, 401, 403, 404, 429].includes(error.status);
        return {
            state: rejected ? 'failed' : 'unknown',
            providerObjectId: id,
            htmlLink: null,
            start: null,
            end: null,
            code: rejected
                ? 'calendar_execution_blocked'
                : 'calendar_outcome_unknown',
        };
    }
}
export async function undoCalendarCreate(
    transport: GoogleCalendarTransport,
    eventId: string,
) {
    try {
        await transport(
            `calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
            { method: 'DELETE' },
        );
    } catch (error) {
        if (
            !(
                error instanceof GoogleCalendarActionError &&
                error.status === 410
            )
        )
            throw error;
    }
    try {
        await transport(
            `calendars/primary/events/${encodeURIComponent(eventId)}`,
        );
        return false;
    } catch (error) {
        return (
            error instanceof GoogleCalendarActionError &&
            (error.status === 404 || error.status === 410)
        );
    }
}
