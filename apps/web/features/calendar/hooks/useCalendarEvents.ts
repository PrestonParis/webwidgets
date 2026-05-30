'use client';

// useCalendarEvents — fetches calendar events for a given month.
//
// Migrated from direct /api/calendar/events fetch to the import-export adapter
// pipeline via useAdapterFetch. Each unique (year, month) pair produces its own
// TanStack Query cache entry so navigating between months does not reuse stale data.
//
// The calendarEventsAdapter returns an inlinePayload:
//   { events: CalendarWidgetEvent[]; isNotConnected: boolean }
// where CalendarWidgetEvent has nested start/end objects that match CalendarEvent.

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    useAdapterFetch,
    type AdapterParams,
} from '@/features/dashboard/runtime/useWidgetData';
import type { CalendarAdapterPayload } from '@/features/import-export/adapters/calendarEventsAdapter';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

function monthRange(
    year: number,
    month: number,
): { start: string; end: string } {
    // Start 7 days before the 1st so Sunday-padded grid cells at the front
    // of the month display events from the previous month.
    // End 8 days into the next month so overflow grid cells at the tail
    // (e.g. June 1–7 visible when viewing May) also show events.
    const start = new Date(year, month, -6);
    const end = new Date(year, month + 1, 8);
    return { start: start.toISOString(), end: end.toISOString() };
}

// CalendarWidgetEvent (from adapter) and CalendarEvent share the same shape
// (nested start/end with dateTime?/date? fields). The adapter constructs them
// via toEventTime(), so the cast is safe.
function toCalendarEvents(payload: CalendarAdapterPayload): CalendarEvent[] {
    return payload.events as CalendarEvent[];
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes per month

export function useCalendarEvents(year: number, month: number) {
    const queryClient = useQueryClient();

    const { start, end } = useMemo(
        () => monthRange(year, month),
        [year, month],
    );

    const params: AdapterParams = useMemo(
        () => ({ startDate: start, endDate: end }),
        [start, end],
    );

    const { data, loading, error } = useAdapterFetch<CalendarAdapterPayload>(
        'calendar_events',
        params,
        { cacheTtlMs: CACHE_TTL_MS },
    );

    const events: CalendarEvent[] = data ? toCalendarEvents(data) : [];
    const isNotConnected = data?.isNotConnected ?? (error !== null && !loading);

    const cacheKey = `${year}-${month}-wide`;

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: [
                'widget-adapter',
                'calendar_events',
                'current_user',
                params,
            ],
        });
    }, [queryClient, params]);

    return { events, loading, isNotConnected, refresh };
}
