import { createHash } from 'node:crypto';
import type {
    CalendarSignal,
    EmailSignal,
    ProviderCursor,
    ProviderSignal,
} from './providerTypes.js';

export function providerHash(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

export function parseProviderCursor(value: string | null): ProviderCursor {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value) as unknown;
        if (!parsed || typeof parsed !== 'object') return {};
        const cursor = parsed as Record<string, unknown>;
        return {
            ...(typeof cursor.email === 'string'
                ? { email: cursor.email }
                : {}),
            ...(typeof cursor.calendar === 'string'
                ? { calendar: cursor.calendar }
                : {}),
        };
    } catch {
        return {};
    }
}

export function serializeProviderCursor(cursor: ProviderCursor) {
    return JSON.stringify(cursor);
}

export function allDayOccurrence(date: string) {
    return `${date}T00:00:00.000Z`;
}

export function signalContentHash(signal: ProviderSignal) {
    if (signal.kind === 'email' && signal.change === 'deleted') {
        return providerHash(JSON.stringify({ ...signal, occurredAt: null }));
    }
    return providerHash(JSON.stringify(signal));
}

export function signalOccurredAt(signal: ProviderSignal) {
    return signal.kind === 'email' ? signal.occurredAt : signal.start;
}

export function signalIdentity(connectionId: string, signal: ProviderSignal) {
    const objectHash = providerHash(signal.objectId);
    const source = `${signal.provider}:${connectionId}`;
    return {
        sourceKey: source,
        observationKey: `${source}:${signal.kind}:${objectHash}:${providerHash(signal.providerVersion)}`,
        timelineKey: `${source}:${signal.kind}:${objectHash}:${signal.change}:${providerHash(signal.providerVersion)}`,
    };
}

export function minimizedSignalPayload(signal: ProviderSignal) {
    if (signal.kind === 'email') return minimizedEmailPayload(signal);
    return minimizedCalendarPayload(signal);
}

function minimizedEmailPayload(signal: EmailSignal) {
    return {
        providerObjectId: signal.objectId,
        threadId: signal.threadId,
        subject: signal.subject,
        senderEmail: signal.senderEmail,
        senderName: signal.senderName,
        snippet: signal.snippet,
        receivedAt: signal.occurredAt,
        isRead: signal.isRead,
        webLink: signal.webLink,
        change: signal.change,
    };
}

function minimizedCalendarPayload(signal: CalendarSignal) {
    return {
        providerObjectId: signal.objectId,
        title: signal.title,
        start: signal.start,
        end: signal.end,
        allDay: signal.allDay,
        calendarId: signal.calendarId,
        location: signal.location,
        webLink: signal.webLink,
        change: signal.change,
    };
}
