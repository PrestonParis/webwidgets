import { describe, expect, it, vi } from 'vitest';
import { calendarActionPayloadSchema } from '@/lib/calendarActions/contracts';
import {
    calendarProviderEventId,
    executeCalendarCreate,
    undoCalendarCreate,
} from '@/lib/calendarActions/googleCalendarAdapter';
import { GoogleCalendarActionError } from '@/lib/calendarActions/googleCalendarTransport';
const requestId = '61111111-1111-4111-8111-111111111111';
const event = calendarActionPayloadSchema.parse({
    provider: 'google',
    accountId: '62222222-2222-4222-8222-222222222222',
    calendarId: 'primary',
    title: 'Approved event',
    description: 'Agenda',
    location: 'Room',
    attendees: ['guest@example.invalid'],
    allDay: false,
    startsAt: '2026-09-01T13:00:00.000Z',
    endsAt: '2026-09-01T14:00:00.000Z',
    timezone: 'America/New_York',
});
const provider = {
    id: calendarProviderEventId(requestId),
    summary: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    htmlLink: 'https://calendar.google.com/event?fixture',
    status: 'confirmed',
    attendees: [{ email: event.attendees[0] }],
    start: {
        dateTime: 'startsAt' in event ? event.startsAt : '',
        timeZone: 'timezone' in event ? event.timezone : '',
    },
    end: {
        dateTime: 'endsAt' in event ? event.endsAt : '',
        timeZone: 'timezone' in event ? event.timezone : '',
    },
    extendedProperties: { private: { webwidgetsRequestId: requestId } },
};
describe('calendar action contract', () => {
    it('validates timed, all-day, timezone and bounded duration rules', () => {
        expect(calendarActionPayloadSchema.safeParse(event).success).toBe(true);
        expect(
            calendarActionPayloadSchema.safeParse({
                ...event,
                timezone: 'Mars/Olympus',
            }).success,
        ).toBe(false);
        expect(
            calendarActionPayloadSchema.safeParse({
                ...event,
                endsAt: '2026-09-01T13:00:00.000Z',
            }).success,
        ).toBe(false);
        expect(
            calendarActionPayloadSchema.safeParse({
                ...event,
                allDay: true,
                startDate: '2026-09-01',
                endDate: '2026-09-02',
            }).success,
        ).toBe(false);
        expect(
            calendarActionPayloadSchema.safeParse({
                provider: 'google',
                accountId: event.accountId,
                calendarId: 'primary',
                title: 'Day',
                description: null,
                location: null,
                attendees: [],
                allDay: true,
                startDate: '2026-09-01',
                endDate: '2026-09-02',
            }).success,
        ).toBe(true);
    });
});
describe('calendar one-shot adapter', () => {
    it('uses a deterministic provider ID, sends guest updates, then verifies exact state', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(provider)
            .mockResolvedValueOnce(provider);
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: true,
            }),
        ).toMatchObject({ state: 'verified', providerObjectId: provider.id });
        expect(api.mock.calls[0]?.[0]).toContain(provider.id);
        expect(api.mock.calls[0]?.[0]).toContain('sendUpdates=all');
    });
    it('reconciles duplicates with a GET and never writes again', async () => {
        const api = vi.fn().mockResolvedValueOnce(provider);
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: false,
            }),
        ).toMatchObject({ state: 'verified' });
        expect(api.mock.calls[0]?.[1]).toBeUndefined();
    });
    it('verifies an existing deterministic event after a provider conflict', async () => {
        const api = vi
            .fn()
            .mockRejectedValueOnce(new GoogleCalendarActionError(409))
            .mockResolvedValueOnce(provider);
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: true,
            }),
        ).toMatchObject({ state: 'verified', providerObjectId: provider.id });
        expect(api).toHaveBeenCalledTimes(2);
        expect(api.mock.calls[1]?.[1]).toBeUndefined();
    });
    it('keeps a timed-out provider write unknown', async () => {
        const api = vi
            .fn()
            .mockRejectedValueOnce(new GoogleCalendarActionError(null));
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: true,
            }),
        ).toMatchObject({ state: 'unknown' });
    });
    it('records a definite provider rejection as failed', async () => {
        const api = vi
            .fn()
            .mockRejectedValueOnce(new GoogleCalendarActionError(403));
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: true,
            }),
        ).toMatchObject({ state: 'failed' });
    });
    it('does not verify changed provider fields', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(provider)
            .mockResolvedValueOnce({ ...provider, summary: 'Changed' });
        expect(
            await executeCalendarCreate(api, {
                requestId,
                event,
                dispatchAllowed: true,
            }),
        ).toMatchObject({ state: 'unknown' });
    });
    it('verifies deletion and treats an already-gone event idempotently', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockRejectedValueOnce(new GoogleCalendarActionError(404));
        expect(await undoCalendarCreate(api, provider.id)).toBe(true);
        const gone = vi
            .fn()
            .mockRejectedValueOnce(new GoogleCalendarActionError(410))
            .mockRejectedValueOnce(new GoogleCalendarActionError(404));
        expect(await undoCalendarCreate(gone, provider.id)).toBe(true);
    });
});
