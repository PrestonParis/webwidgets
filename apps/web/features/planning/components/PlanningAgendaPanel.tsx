'use client';

import { Plus } from 'lucide-react';
import { EventDetail } from '@/features/calendar/components/EventDetail';
import {
    eventColor,
    formatEventTime,
    isAllDay,
} from '@/features/calendar/types/calendar';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PlanningAgendaPanelProps {
    selectedLabel: string;
    selectedEvents: CalendarEvent[];
    today: Date;
    getDayEvents: (date: Date) => CalendarEvent[];
    onAddEvent: () => void;
    onEditEvent: (event: CalendarEvent) => void;
    onDeleteEvent: (event: CalendarEvent) => Promise<void>;
    onSelectDate: (date: Date) => void;
}

export function PlanningAgendaPanel({
    selectedLabel,
    selectedEvents,
    today,
    getDayEvents,
    onAddEvent,
    onEditEvent,
    onDeleteEvent,
    onSelectDate,
}: PlanningAgendaPanelProps) {
    const upcomingDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        return d;
    });

    return (
        <aside className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Selected day header */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                            {selectedLabel}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {selectedEvents.length === 0
                                ? 'Nothing scheduled'
                                : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button
                        onClick={onAddEvent}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        title="Add event"
                    >
                        <Plus size={14} className="text-zinc-400" />
                    </button>
                </div>
            </div>

            {/* Selected day events */}
            <div
                className="px-4 py-2 shrink-0 overflow-y-auto"
                style={{ maxHeight: '40%' }}
            >
                {selectedEvents.length === 0 ? (
                    <p className="text-xs text-zinc-300 dark:text-zinc-700 py-4 text-center">
                        Free
                    </p>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {selectedEvents.map((e) => (
                            <div key={e.id} className="group">
                                <EventDetail
                                    event={e}
                                    onEdit={() => onEditEvent(e)}
                                    onDelete={() => void onDeleteEvent(e)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming 7 days */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 flex-1 overflow-y-auto min-h-0">
                <p className="px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest sticky top-0 bg-white dark:bg-zinc-900">
                    Upcoming
                </p>
                <div className="px-3 pb-4 space-y-0.5">
                    {upcomingDays.map((day, i) => {
                        const dayEvents = getDayEvents(day);
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onSelectDate(day)}
                                className="flex w-full items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
                            >
                                <div className="text-center shrink-0 w-9 pt-0.5">
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase leading-none">
                                        {WEEKDAYS_SHORT[day.getDay()]}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                                        {day.getDate()}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    {dayEvents.length === 0 ? (
                                        <p className="text-xs text-zinc-300 dark:text-zinc-700">
                                            Free
                                        </p>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 2).map((e) => (
                                                <p
                                                    key={e.id}
                                                    className="text-xs text-zinc-600 dark:text-zinc-400 truncate flex items-center gap-1.5"
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventColor(e.colorId)}`}
                                                    />
                                                    {isAllDay(e)
                                                        ? 'All day · '
                                                        : `${formatEventTime(e)} · `}
                                                    {e.summary}
                                                </p>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                                                    +{dayEvents.length - 2} more
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
