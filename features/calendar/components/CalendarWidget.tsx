'use client';

import { useMemo } from 'react';
import { Video } from 'lucide-react';
import { useCalendarEvents } from '@/features/calendar/hooks/useCalendarEvents';
import {
    eventColor,
    eventStart,
    formatEventTime,
    isAllDay,
    CalendarEvent,
} from '@/features/calendar/types/calendar';
import { useAuth } from '@/features/auth/hooks/useAuth';

const UPCOMING_DAYS = 7;

function UpcomingEvent({ event }: { event: CalendarEvent }) {
    const start = eventStart(event);
    const today = new Date();
    const isToday = start.toDateString() === today.toDateString();
    const isTomorrow =
        start.toDateString() ===
        new Date(today.getTime() + 86400000).toDateString();

    const dateLabel = isToday
        ? 'Today'
        : isTomorrow
          ? 'Tomorrow'
          : start.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });

    return (
        <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 dark:border-zinc-900 last:border-0">
            <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${eventColor(event.colorId)}`}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-snug text-gray-800 dark:text-zinc-100">
                    {event.summary}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    {dateLabel}
                    {!isAllDay(event) && ` · ${formatEventTime(event)}`}
                </p>
            </div>
            {event.hangoutLink && (
                <a
                    href={event.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 mt-0.5 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    aria-label="Join meeting"
                >
                    <Video size={12} />
                </a>
            )}
        </div>
    );
}

function CalendarWidgetNotConnected() {
    const { connectCalendar } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Connect Google Calendar to see your upcoming events
            </p>
            <button
                onClick={() => {
                    void connectCalendar();
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
            >
                Connect
            </button>
        </div>
    );
}

export function CalendarWidget() {
    const today = useMemo(() => new Date(), []);
    const { events, loading, isNotConnected } = useCalendarEvents(
        today.getFullYear(),
        today.getMonth(),
    );

    const upcoming = useMemo(() => {
        const cutoff = new Date(today.getTime() + UPCOMING_DAYS * 86400000);
        return events
            .filter((e) => {
                const s = eventStart(e);
                return s >= today && s <= cutoff;
            })
            .slice(0, 5);
    }, [events, today]);

    if (isNotConnected) return <CalendarWidgetNotConnected />;

    if (loading && events.length === 0) {
        return (
            <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-8 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (upcoming.length === 0) {
        return (
            <p className="text-xs text-gray-400 dark:text-zinc-500 py-4 text-center">
                No events in the next {UPCOMING_DAYS} days
            </p>
        );
    }

    return (
        <div>
            {upcoming.map((e) => (
                <UpcomingEvent key={e.id} event={e} />
            ))}
        </div>
    );
}
