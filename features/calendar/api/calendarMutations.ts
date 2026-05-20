import type {
    CalendarEvent,
    CalendarEventInput,
} from '@/features/calendar/types/calendar';

const CALENDAR_EVENTS_API = '/api/calendar/events';

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export async function createCalendarEvent(
    input: CalendarEventInput,
): Promise<CalendarEvent> {
    const res = await fetch(CALENDAR_EVENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    return handleResponse<CalendarEvent>(res);
}

export async function updateCalendarEvent(
    eventId: string,
    input: Partial<CalendarEventInput>,
): Promise<CalendarEvent> {
    const res = await fetch(CALENDAR_EVENTS_API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...input }),
    });
    return handleResponse<CalendarEvent>(res);
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
    const res = await fetch(
        `${CALENDAR_EVENTS_API}?eventId=${encodeURIComponent(eventId)}`,
        { method: 'DELETE' },
    );
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to delete event');
    }
}
