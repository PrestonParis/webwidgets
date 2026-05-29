'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import {
    useCalendarPage,
    isSameDay,
} from '@/features/calendar/hooks/useCalendarPage';
import { EventFormModal } from '@/features/calendar/components/EventFormModal';
import { CalendarNotConnected } from '@/features/calendar/components/CalendarNotConnected';
import {
    eventColor,
    formatEventTime,
    isAllDay,
} from '@/features/calendar/types/calendar';
import { cn } from '@/lib/utils/utils';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

interface UpcomingEntry {
    date: Date;
    event: CalendarEvent;
}

function upcomingLabel(entry: UpcomingEntry, today: Date): string {
    const { date, event } = entry;
    const dayLabel = isSameDay(date, today)
        ? 'Today'
        : date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
          });
    return isAllDay(event)
        ? dayLabel
        : `${dayLabel} · ${formatEventTime(event)}`;
}

export default function CalendarWidget() {
    const {
        today,
        viewYear,
        viewMonth,
        setViewYear,
        setViewMonth,
        selectedDate,
        setSelectedDate,
        formOpen,
        setFormOpen,
        editingEvent,
        loading,
        isNotConnected,
        refresh,
        grid,
        getDayEvents,
        prevMonth,
        nextMonth,
        openCreate,
        createInitialData,
    } = useCalendarPage();

    const isCurrentView =
        viewMonth === today.getMonth() && viewYear === today.getFullYear();

    // Collect upcoming events: today + next 13 days, max 5
    const upcoming: UpcomingEntry[] = [];
    for (let i = 0; i < 14 && upcoming.length < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        for (const e of getDayEvents(d)) {
            if (upcoming.length < 5) upcoming.push({ date: d, event: e });
        }
    }

    return (
        <WidgetShell
            icon={<span className="text-base">📅</span>}
            title="Calendar"
            badge="Google"
            widgetId="calendar"
            widgetType="calendar"
            footerHref="/planning"
            footerLabel="Open Planning →"
        >
            {isNotConnected ? (
                <CalendarNotConnected />
            ) : (
                <>
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={prevMonth}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <ChevronLeft
                                    size={12}
                                    className="text-zinc-400"
                                />
                            </button>
                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 min-w-17 text-center">
                                {MONTHS[viewMonth]} {viewYear}
                            </span>
                            <button
                                onClick={nextMonth}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <ChevronRight
                                    size={12}
                                    className="text-zinc-400"
                                />
                            </button>
                            {!isCurrentView && (
                                <button
                                    onClick={() => {
                                        setViewYear(today.getFullYear());
                                        setViewMonth(today.getMonth());
                                        setSelectedDate(today);
                                    }}
                                    className="text-[10px] text-indigo-500 hover:text-indigo-600 font-medium ml-1"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                        >
                            <Plus size={10} />
                            Add
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-0.5">
                        {WEEKDAYS.map((d, i) => (
                            <div
                                key={i}
                                className="text-center text-[9px] font-semibold text-zinc-400 dark:text-zinc-600 pb-0.5"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Compact day grid — h-7 (28px) per cell, no gaps */}
                    <div className="grid grid-cols-7 mb-3">
                        {grid.map((date, i) => {
                            const events = getDayEvents(date);
                            const isToday = isSameDay(date, today);
                            const isSelected = isSameDay(date, selectedDate);
                            const inMonth = date.getMonth() === viewMonth;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        'flex flex-col items-center pt-0.5 h-7 rounded transition-colors',
                                        inMonth
                                            ? 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                                            : 'opacity-20 pointer-events-none',
                                        isSelected &&
                                            !isToday &&
                                            'bg-blue-50 dark:bg-blue-900/20',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium leading-none',
                                            isToday
                                                ? 'bg-blue-500 text-white font-bold'
                                                : isSelected
                                                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                                  : 'text-zinc-700 dark:text-zinc-300',
                                        )}
                                    >
                                        {date.getDate()}
                                    </span>
                                    {events.length > 0 && (
                                        <div className="flex gap-px mt-px">
                                            {events.slice(0, 3).map((e) => (
                                                <span
                                                    key={e.id}
                                                    className={`w-1 h-1 rounded-full ${eventColor(e.colorId)}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Upcoming events */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-1.5">
                        {loading ? (
                            <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : upcoming.length === 0 ? (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center py-1">
                                No upcoming events
                            </p>
                        ) : (
                            upcoming.map(({ date, event }, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 min-w-0"
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventColor(event.colorId)}`}
                                    />
                                    <span className="flex-1 text-[11px] truncate text-zinc-700 dark:text-zinc-300">
                                        {event.summary}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                        {upcomingLabel({ date, event }, today)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            <EventFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={refresh}
                editEvent={editingEvent}
                initialData={editingEvent ? undefined : createInitialData}
            />
        </WidgetShell>
    );
}
