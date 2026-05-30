'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react';
import { DayCell } from '@/features/calendar/components/CalendarDayCell';
import { CalendarSettingsModal } from '@/features/calendar/components/CalendarSettingsModal';
import { useCalendarSettings } from '@/features/calendar/hooks/useCalendarSettings';
import { isSameDay } from '@/features/calendar/hooks/useCalendarPage';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

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

interface PlanningCalendarGridProps {
    today: Date;
    viewYear: number;
    viewMonth: number;
    setViewYear: (year: number) => void;
    setViewMonth: (month: number) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    grid: Date[];
    getDayEvents: (date: Date) => CalendarEvent[];
    prevMonth: () => void;
    nextMonth: () => void;
    loading: boolean;
    onNewEvent: () => void;
}

export function PlanningCalendarGrid({
    today,
    viewYear,
    viewMonth,
    setViewYear,
    setViewMonth,
    selectedDate,
    setSelectedDate,
    grid,
    getDayEvents,
    prevMonth,
    nextMonth,
    loading,
    onNewEvent,
}: PlanningCalendarGridProps) {
    const isCurrentView =
        viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { settings, updateSettings } = useCalendarSettings();

    return (
        <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={14} className="text-zinc-500" />
                    </button>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 min-w-34 text-center">
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight size={14} className="text-zinc-500" />
                    </button>
                    {!isCurrentView && (
                        <button
                            onClick={() => {
                                setViewYear(today.getFullYear());
                                setViewMonth(today.getMonth());
                                setSelectedDate(today);
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium ml-1"
                        >
                            Today
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {loading && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            Syncing…
                        </span>
                    )}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Calendar settings"
                    >
                        <Settings2 size={14} className="text-zinc-400" />
                    </button>
                    <button
                        onClick={onNewEvent}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                    >
                        <Plus size={12} />
                        New event
                    </button>
                </div>
            </div>
            {settingsOpen && (
                <CalendarSettingsModal
                    settings={settings}
                    onSave={updateSettings}
                    onClose={() => setSettingsOpen(false)}
                />
            )}

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
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
    );
}
