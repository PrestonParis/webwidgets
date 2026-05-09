import { describe, it, expect } from 'vitest';
import {
    eventColor,
    isAllDay,
    eventStart,
    formatEventTime,
    EVENT_COLORS,
} from '@/features/calendar/types/calendar';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
    return {
        id: 'evt-1',
        summary: 'Test Event',
        description: null,
        location: null,
        start: { dateTime: '2026-05-09T10:00:00-07:00' },
        end: { dateTime: '2026-05-09T11:00:00-07:00' },
        htmlLink: 'https://calendar.google.com',
        ...overrides,
    };
}

describe('isAllDay', () => {
    it('returns true when only date is set', () => {
        const event = makeEvent({
            start: { date: '2026-05-09' },
            end: { date: '2026-05-10' },
        });
        expect(isAllDay(event)).toBe(true);
    });

    it('returns false when dateTime is set', () => {
        const event = makeEvent({
            start: { dateTime: '2026-05-09T10:00:00Z' },
        });
        expect(isAllDay(event)).toBe(false);
    });

    it('returns false when both date and dateTime are set', () => {
        const event = makeEvent({
            start: { date: '2026-05-09', dateTime: '2026-05-09T10:00:00Z' },
        });
        expect(isAllDay(event)).toBe(false);
    });
});

describe('eventStart', () => {
    it('parses dateTime into a Date', () => {
        const event = makeEvent({
            start: { dateTime: '2026-05-09T10:00:00Z' },
        });
        const d = eventStart(event);
        expect(d).toBeInstanceOf(Date);
        expect(d.getUTCFullYear()).toBe(2026);
        expect(d.getUTCMonth()).toBe(4); // May = 4
        expect(d.getUTCDate()).toBe(9);
    });

    it('falls back to date when no dateTime', () => {
        const event = makeEvent({
            start: { date: '2026-06-01' },
            end: { date: '2026-06-02' },
        });
        const d = eventStart(event);
        expect(d.getUTCFullYear()).toBe(2026);
        expect(d.getUTCMonth()).toBe(5); // June = 5 (UTC, since date-only parses at midnight UTC)
    });

    it('returns an Invalid Date for empty start', () => {
        const event = makeEvent({ start: {} });
        expect(isNaN(eventStart(event).getTime())).toBe(true);
    });
});

describe('eventColor', () => {
    it('returns the mapped Tailwind class for a known colorId', () => {
        for (const [id, cls] of Object.entries(EVENT_COLORS)) {
            expect(eventColor(id)).toBe(cls);
        }
    });

    it('returns the default color for an unknown colorId', () => {
        const result = eventColor('999');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('returns the default color when colorId is undefined', () => {
        const result = eventColor(undefined);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});

describe('formatEventTime', () => {
    it('returns "All day" for all-day events', () => {
        const event = makeEvent({
            start: { date: '2026-05-09' },
            end: { date: '2026-05-10' },
        });
        expect(formatEventTime(event)).toBe('All day');
    });

    it('returns a time string for timed events', () => {
        const event = makeEvent({
            start: { dateTime: '2026-05-09T14:30:00Z' },
        });
        const result = formatEventTime(event);
        expect(result).not.toBe('All day');
        expect(result.length).toBeGreaterThan(0);
    });
});
