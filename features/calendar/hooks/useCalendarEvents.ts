'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

const eventSchema = z.object({
    id: z.string(),
    summary: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    start: z.object({
        dateTime: z.string().optional(),
        date: z.string().optional(),
        timeZone: z.string().optional(),
    }),
    end: z.object({
        dateTime: z.string().optional(),
        date: z.string().optional(),
        timeZone: z.string().optional(),
    }),
    htmlLink: z.string(),
    hangoutLink: z.string().optional(),
    colorId: z.string().optional(),
});

const responseSchema = z.object({
    events: z.array(eventSchema),
    error: z.string().optional(),
});

function monthRange(
    year: number,
    month: number,
): { start: string; end: string } {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return { start: start.toISOString(), end: end.toISOString() };
}

interface CacheEntry {
    events: CalendarEvent[];
    fetchedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export function useCalendarEvents(year: number, month: number) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [isNotConnected, setIsNotConnected] = useState(false);
    const [fetchVersion, setFetchVersion] = useState(0);
    const inflightRef = useRef<string | null>(null);

    const refresh = useCallback(() => {
        cache.delete(`${year}-${month}`);
        setFetchVersion((v) => v + 1);
    }, [year, month]);

    useEffect(() => {
        const key = `${year}-${month}`;

        async function load() {
            const hit = cache.get(key);
            if (hit && Date.now() - hit.fetchedAt < CACHE_TTL) {
                setEvents(hit.events);
                return;
            }

            if (inflightRef.current === key) return;
            inflightRef.current = key;
            setLoading(true);

            try {
                const { start, end } = monthRange(year, month);
                const res = await fetch(
                    `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
                    { credentials: 'include', cache: 'no-store' },
                );

                if (res.status === 403) {
                    setIsNotConnected(true);
                    return;
                }

                const json: unknown = await res.json();
                const parsed = responseSchema.safeParse(json);
                if (!parsed.success) return;

                const evts = parsed.data.events as CalendarEvent[];
                cache.set(key, { events: evts, fetchedAt: Date.now() });
                setEvents(evts);
            } catch {
                // network error — leave previous state
            } finally {
                inflightRef.current = null;
                setLoading(false);
            }
        }

        void load();
    }, [year, month, fetchVersion]);

    return { events, loading, isNotConnected, refresh };
}
