'use client';

import { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Video,
    MapPin,
    ExternalLink,
} from 'lucide-react';
import { useCalendarEvents } from '@/features/calendar/hooks/useCalendarEvents';
import {
    CalendarEvent,
    eventColor,
    eventStart,
    formatEventTime,
    isAllDay,
} from '@/features/calendar/types/calendar';
import { useAuth } from '@/features/auth/hooks/useAuth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function buildGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(new Date(year, month, -firstDay.getDay() + i + 1));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    while (days.length < 42) {
        days.push(
            new Date(
                year,
                month + 1,
                days.length - lastDay.getDate() - firstDay.getDay() + 1,
            ),
        );
    }
    return days;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function EventDot({ event }: { event: CalendarEvent }) {
    return (
        <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${eventColor(event.colorId)}`}
            title={event.summary}
        />
    );
}

function DayCell({
    date,
    events,
    isCurrentMonth,
    isToday,
    isSelected,
    onClick,
}: {
    date: Date;
    events: CalendarEvent[];
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    onClick: () => void;
}) {
    const visible = events.slice(0, 3);
    const overflow = events.length - 3;

    return (
        <button
            onClick={onClick}
            className={`
                group relative min-h-[72px] p-2 rounded-xl text-left transition-colors
                ${isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-zinc-800/60' : 'opacity-40'}
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700' : ''}
            `}
        >
            <span
                className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                    ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-zinc-300'}
                    ${isSelected && !isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}
                `}
            >
                {date.getDate()}
            </span>

            <div className="mt-1 flex flex-wrap gap-0.5">
                {visible.map((e) => (
                    <EventDot key={e.id} event={e} />
                ))}
            </div>

            {overflow > 0 && (
                <span className="text-[9px] text-gray-400 dark:text-zinc-600 mt-0.5 block">
                    +{overflow}
                </span>
            )}

            <div className="absolute inset-x-2 top-8 hidden group-hover:block z-10 space-y-0.5 max-h-24 overflow-hidden">
                {visible.map((e) => (
                    <p
                        key={e.id}
                        className={`text-[10px] font-medium px-1 py-0.5 rounded truncate text-white ${eventColor(e.colorId)}`}
                    >
                        {isAllDay(e) ? '' : `${formatEventTime(e)} `}
                        {e.summary}
                    </p>
                ))}
            </div>
        </button>
    );
}

function EventDetail({ event }: { event: CalendarEvent }) {
    return (
        <div className="py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-start gap-2">
                <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${eventColor(event.colorId)}`}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug text-gray-800 dark:text-zinc-100">
                        {event.summary}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {formatEventTime(event)}
                    </p>
                    {event.location && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 mt-1 truncate">
                            <MapPin size={10} />
                            {event.location}
                        </p>
                    )}
                    {event.description && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 line-clamp-2">
                            {event.description.replace(/<[^>]+>/g, '')}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                        {event.hangoutLink && (
                            <a
                                href={event.hangoutLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <Video size={10} /> Join
                            </a>
                        )}
                        <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
                        >
                            <ExternalLink size={10} /> Open
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CalendarNotConnected() {
    const { connectCalendar } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">
                📅
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                    Connect Google Calendar
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    View your events alongside your dashboard
                </p>
            </div>
            <button
                onClick={() => {
                    void connectCalendar();
                }}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
                Connect Calendar
            </button>
        </div>
    );
}

export function CalendarPage() {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<Date>(today);

    const { events, loading, isNotConnected } = useCalendarEvents(
        viewYear,
        viewMonth,
    );

    const grid = useMemo(
        () => buildGrid(viewYear, viewMonth),
        [viewYear, viewMonth],
    );

    const eventsForDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const e of events) {
            const d = eventStart(e);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const arr = map.get(key) ?? [];
            arr.push(e);
            map.set(key, arr);
        }
        return map;
    }, [events]);

    function getDayEvents(date: Date): CalendarEvent[] {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return eventsForDay.get(key) ?? [];
    }

    function prevMonth() {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else setViewMonth((m) => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else setViewMonth((m) => m + 1);
    }

    const selectedEvents = getDayEvents(selectedDate);

    const selectedLabel = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    if (isNotConnected) return <CalendarNotConnected />;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Calendar
                </h2>
                {loading && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                        Syncing…
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Calendar Grid */}
                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-zinc-800">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                                {MONTHS[viewMonth]} {viewYear}
                            </h3>
                            {(viewMonth !== today.getMonth() ||
                                viewYear !== today.getFullYear()) && (
                                <button
                                    onClick={() => {
                                        setViewYear(today.getFullYear());
                                        setViewMonth(today.getMonth());
                                        setSelectedDate(today);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800">
                        {WEEKDAYS.map((d) => (
                            <div
                                key={d}
                                className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-zinc-800/60">
                        {grid.map((date, i) => (
                            <DayCell
                                key={i}
                                date={date}
                                events={getDayEvents(date)}
                                isCurrentMonth={date.getMonth() === viewMonth}
                                isToday={isSameDay(date, today)}
                                isSelected={isSameDay(date, selectedDate)}
                                onClick={() => setSelectedDate(date)}
                            />
                        ))}
                    </div>
                </div>

                {/* Day detail panel */}
                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col">
                    <div className="px-4 py-3.5 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                            {selectedLabel}
                        </p>
                        {selectedEvents.length > 0 && (
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                {selectedEvents.length} event
                                {selectedEvents.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="px-4 py-2 flex-1 overflow-y-auto">
                        {selectedEvents.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-zinc-600 py-6 text-center">
                                No events
                            </p>
                        ) : (
                            selectedEvents.map((e) => (
                                <EventDetail key={e.id} event={e} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
