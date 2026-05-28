'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';
import { isAllDay } from '@/features/calendar/types/calendar';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

const STORAGE_KEY = 'cal_notified_events_v1';
const CHECK_INTERVAL_MS = 60_000; // re-check every minute
const WARN_MINUTES = 15; // notify 15 minutes before start
const WARN_WINDOW_MS = WARN_MINUTES * 60_000;
const NOTIFIED_TTL_MS = 2 * 60 * 60_000; // forget after 2 hours (prevents re-fire after page reload)

interface NotifiedEntry {
    firedAt: number;
}

function loadNotified(): Map<string, NotifiedEntry> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Map();
        return new Map(
            Object.entries(JSON.parse(raw) as Record<string, NotifiedEntry>),
        );
    } catch {
        return new Map();
    }
}

function saveNotified(map: Map<string, NotifiedEntry>): void {
    const now = Date.now();
    // Prune stale entries before saving
    const pruned: Record<string, NotifiedEntry> = {};
    for (const [id, entry] of map) {
        if (now - entry.firedAt < NOTIFIED_TTL_MS) pruned[id] = entry;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
}

function formatEventTime(event: CalendarEvent): string {
    const raw = event.start.dateTime;
    if (!raw) return '';
    return new Date(raw).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function minutesUntil(isoString: string): number {
    return (new Date(isoString).getTime() - Date.now()) / 60_000;
}

export function useCalendarEventNotifications() {
    // We keep a ref to the latest events so the interval always sees fresh data
    // without needing to re-register the interval on each render.
    const eventsRef = useRef<CalendarEvent[]>([]);

    // Fetch today's events and check against the notification window
    async function fetchAndCheck() {
        const addNotification = useNotificationStore.getState().addNotification;
        const existingNotifications =
            useNotificationStore.getState().notifications;
        const notified = loadNotified();
        const now = Date.now();

        let events: CalendarEvent[] = eventsRef.current;

        // If we have no cached events (first run or stale), fetch
        if (events.length === 0) {
            try {
                const today = new Date();
                const start = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                ).toISOString();
                const end = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() + 1,
                ).toISOString();
                const res = await fetch(
                    `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
                    { credentials: 'include', cache: 'no-store' },
                );
                if (res.ok) {
                    const json = (await res.json()) as {
                        events?: CalendarEvent[];
                    };
                    events = json.events ?? [];
                    eventsRef.current = events;
                }
            } catch {
                return; // network error — silently skip
            }
        }

        for (const event of events) {
            if (isAllDay(event) || !event.start.dateTime) continue;

            const minsUntil = minutesUntil(event.start.dateTime);
            const eventStartMs = new Date(event.start.dateTime).getTime();

            // Only notify if within the warning window and not already started
            if (minsUntil < 0 || minsUntil > WARN_MINUTES) continue;

            const notifId = `cal-${event.id}-${Math.floor(eventStartMs / WARN_WINDOW_MS)}`;

            // Skip if already fired (persisted or in current session)
            if (notified.has(notifId)) continue;
            if (
                existingNotifications.some(
                    (n) => n.widgetId === notifId && !n.read,
                )
            )
                continue;

            const minsLabel =
                minsUntil < 1 ? 'now' : `in ${Math.round(minsUntil)} min`;
            const timeStr = formatEventTime(event);

            addNotification({
                widgetId: notifId,
                title: event.summary,
                body: `Starting ${minsLabel}${timeStr ? ` at ${timeStr}` : ''}${event.location ? ` · ${event.location}` : ''}`,
                category: minsUntil < 2 ? 'alert' : 'info',
                href: '/planning',
            });

            notified.set(notifId, { firedAt: now });
        }

        saveNotified(notified);
    }

    useEffect(() => {
        // Clear cached events at midnight so next day's events are fresh
        function onVisibilityChange() {
            if (document.visibilityState === 'visible') {
                eventsRef.current = [];
                void fetchAndCheck();
            }
        }

        void fetchAndCheck();
        const interval = setInterval(
            () => void fetchAndCheck(),
            CHECK_INTERVAL_MS,
        );
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
