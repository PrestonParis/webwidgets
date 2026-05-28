'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react';
import { DayCell } from '@/features/calendar/components/CalendarDayCell';
import { EventDetail } from '@/features/calendar/components/EventDetail';
import { CalendarNotConnected } from '@/features/calendar/components/CalendarNotConnected';
import { EventFormModal } from '@/features/calendar/components/EventFormModal';
import { CalendarSettingsModal } from '@/features/calendar/components/CalendarSettingsModal';
import { useCalendarSettings } from '@/features/calendar/hooks/useCalendarSettings';
import {
    useCalendarPage,
    isSameDay,
} from '@/features/calendar/hooks/useCalendarPage';

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

export function CalendarPage() {
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
        openEdit,
        handleDelete,
        selectedEvents,
        selectedLabel,
        createInitialData,
    } = useCalendarPage();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { settings, updateSettings } = useCalendarSettings();

    if (isNotConnected) return <CalendarNotConnected />;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Calendar
                </h2>
                <div className="flex items-center gap-3">
                    {loading && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            Syncing…
                        </span>
                    )}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Calendar settings"
                    >
                        <Settings2 size={15} className="text-zinc-400" />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4f6ef7] hover:bg-[#3d5ce0] text-white text-xs font-medium transition-colors"
                    >
                        <Plus size={13} />
                        New event
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
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

                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col">
                    <div className="px-4 py-3.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
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
                        <button
                            onClick={openCreate}
                            title="Add event on this day"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Plus
                                size={14}
                                className="text-zinc-400 hover:text-zinc-200 transition-colors"
                            />
                        </button>
                    </div>
                    <div className="px-4 py-2 flex-1 overflow-y-auto">
                        {selectedEvents.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-zinc-600 py-6 text-center">
                                No events
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                                {selectedEvents.map((e) => (
                                    <div key={e.id} className="group">
                                        <EventDetail
                                            event={e}
                                            onEdit={() => openEdit(e)}
                                            onDelete={() =>
                                                void handleDelete(e)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EventFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={refresh}
                editEvent={editingEvent}
                initialData={editingEvent ? undefined : createInitialData}
            />
            {settingsOpen && (
                <CalendarSettingsModal
                    settings={settings}
                    onSave={updateSettings}
                    onClose={() => setSettingsOpen(false)}
                />
            )}
        </div>
    );
}
