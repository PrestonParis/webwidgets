export interface CalendarEventTime {
    dateTime?: string;
    date?: string;
    timeZone?: string;
}

// Structured input accepted by POST /api/calendar/events and PATCH.
// Used by the event form and by email actions to create calendar events programmatically.
export interface CalendarEventInput {
    summary: string;
    description?: string | null;
    location?: string | null;
    start: CalendarEventTime;
    end: CalendarEventTime;
    colorId?: string | null;
}

export interface CalendarEvent {
    id: string;
    summary: string;
    description: string | null;
    location: string | null;
    start: CalendarEventTime;
    end: CalendarEventTime;
    htmlLink: string;
    hangoutLink?: string;
    colorId?: string;
}

// Google Calendar colorId → Tailwind bg class
export const EVENT_COLORS: Record<string, string> = {
    '1': 'bg-red-400',
    '2': 'bg-pink-400',
    '3': 'bg-orange-400',
    '4': 'bg-yellow-400',
    '5': 'bg-green-400',
    '6': 'bg-emerald-700',
    '7': 'bg-teal-400',
    '8': 'bg-blue-500',
    '9': 'bg-indigo-300',
    '10': 'bg-purple-400',
    '11': 'bg-zinc-400',
};

export const DEFAULT_EVENT_COLOR = 'bg-blue-500';

export function eventColor(colorId?: string): string {
    return (colorId && EVENT_COLORS[colorId]) ?? DEFAULT_EVENT_COLOR;
}

export function isAllDay(event: CalendarEvent): boolean {
    return Boolean(event.start.date && !event.start.dateTime);
}

export function eventStart(event: CalendarEvent): Date {
    const raw = event.start.dateTime ?? event.start.date ?? '';
    return new Date(raw);
}

export function formatEventTime(event: CalendarEvent): string {
    if (isAllDay(event)) return 'All day';
    const d = eventStart(event);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}
