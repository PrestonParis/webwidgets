'use client';

import { useState } from 'react';
import {
    Check,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Plus,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useTodos } from '@/features/todo/hooks/useTodos';
import {
    useCalendarPage,
    isSameDay,
} from '@/features/calendar/hooks/useCalendarPage';
import { EventDetail } from '@/features/calendar/components/EventDetail';
import { EventFormModal } from '@/features/calendar/components/EventFormModal';
import { eventColor } from '@/features/calendar/types/calendar';
import type { CalendarEvent } from '@/features/calendar/types/calendar';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_SHORT = [
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

// ── Mini day cell ─────────────────────────────────────────────────────────────

function MiniDayCell({
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
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center py-1 rounded-md transition-colors',
                !isCurrentMonth && 'opacity-25',
                isSelected
                    ? 'bg-indigo-500'
                    : isToday
                      ? 'ring-1 ring-indigo-400 dark:ring-indigo-500'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
        >
            <span
                className={cn(
                    'text-[11px] font-medium leading-none',
                    isSelected
                        ? 'text-white'
                        : isToday
                          ? 'text-indigo-500 dark:text-indigo-400 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300',
                )}
            >
                {date.getDate()}
            </span>
            {events.length > 0 && (
                <div className="flex gap-px mt-0.5">
                    {events.slice(0, 3).map((e) => (
                        <span
                            key={e.id}
                            className={cn(
                                'w-1 h-1 rounded-full',
                                isSelected
                                    ? 'bg-white/70'
                                    : eventColor(e.colorId),
                            )}
                        />
                    ))}
                    {events.length > 3 && (
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    )}
                </div>
            )}
        </button>
    );
}

// ── Tasks section ─────────────────────────────────────────────────────────────

function TasksSection() {
    const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();
    const [input, setInput] = useState('');

    const incomplete = todos.filter((t) => !t.completed).slice(0, 6);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        await addTodo(input.trim());
        setInput('');
    }

    return (
        <div className="border-t border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    <CheckSquare size={11} />
                    Tasks
                </div>
                <a
                    href="/todo"
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                >
                    All <ExternalLink size={9} />
                </a>
            </div>

            <form
                onSubmit={(e) => void handleSubmit(e)}
                className="px-3 pb-1.5 shrink-0"
            >
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus-within:border-indigo-400 transition-colors">
                    <Plus size={11} className="text-zinc-400 shrink-0" />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Add task…"
                        className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                </div>
            </form>

            <ul className="overflow-y-auto no-scrollbar px-2 pb-3 space-y-0.5 min-h-0 max-h-36">
                {loading && (
                    <div className="space-y-1 px-1">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                            />
                        ))}
                    </div>
                )}
                {!loading && incomplete.length === 0 && (
                    <li className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-2">
                        All clear ✓
                    </li>
                )}
                {incomplete.map((todo) => (
                    <li
                        key={todo.id}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <button
                            onClick={() => void toggleTodo(todo.id)}
                            className="w-3.5 h-3.5 shrink-0 rounded border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-400 flex items-center justify-center transition-colors"
                        >
                            {todo.completed && (
                                <Check size={9} className="text-indigo-500" />
                            )}
                        </button>
                        <span className="flex-1 text-xs truncate text-zinc-700 dark:text-zinc-300">
                            {todo.text}
                        </span>
                        <button
                            onClick={() => void deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                        >
                            <X size={10} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InboxRightRail() {
    const {
        today,
        viewYear,
        viewMonth,
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

    if (isNotConnected) {
        return (
            <aside className="flex flex-col h-full bg-white dark:bg-zinc-900 items-center justify-start pt-8 px-4">
                <p className="text-xs text-zinc-400 text-center mb-3">
                    Connect Google Calendar to see events here.
                </p>
                <a
                    href="/calendar"
                    className="text-xs text-blue-500 hover:underline"
                >
                    Set up Calendar →
                </a>
                <div className="mt-8 w-full">
                    <TasksSection />
                </div>
            </aside>
        );
    }

    return (
        <aside className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
            {/* ── Mini calendar ─────────────────────────────────────────── */}

            {/* Month nav */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronLeft size={13} className="text-zinc-500" />
                    </button>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 min-w-20 text-center">
                        {MONTHS_SHORT[viewMonth]} {viewYear}
                    </span>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronRight size={13} className="text-zinc-500" />
                    </button>
                    {!(
                        viewMonth === today.getMonth() &&
                        viewYear === today.getFullYear()
                    ) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDate(today);
                            }}
                            className="text-[10px] text-indigo-500 hover:text-indigo-600 font-medium ml-1"
                        >
                            Today
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <a
                        href="/calendar"
                        className="text-[10px] text-zinc-400 hover:text-indigo-500 transition-colors"
                        title="Open full calendar"
                    >
                        <ExternalLink size={12} />
                    </a>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-medium transition-colors"
                    >
                        <Plus size={11} />
                        New
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-2 pt-1 shrink-0">
                {WEEKDAYS_NARROW.map((d, i) => (
                    <div
                        key={i}
                        className="text-center text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 py-0.5"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid — 6 rows of 7 compact cells */}
            <div className="grid grid-cols-7 grid-rows-6 px-2 pb-2 gap-px shrink-0">
                {grid.map((date, i) => (
                    <MiniDayCell
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

            {/* ── Selected day events ───────────────────────────────────── */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate">
                        {selectedLabel}
                    </p>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        title="Add event"
                    >
                        <Plus size={13} className="text-zinc-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-3 pb-2">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : selectedEvents.length === 0 ? (
                        <p className="text-xs text-zinc-300 dark:text-zinc-700 text-center py-3">
                            No events
                        </p>
                    ) : (
                        <div>
                            {selectedEvents.map((e) => (
                                <div key={e.id} className="group">
                                    <EventDetail
                                        event={e}
                                        onEdit={() => openEdit(e)}
                                        onDelete={() => void handleDelete(e)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tasks ────────────────────────────────────────────────── */}
            <TasksSection />

            {/* Event form modal */}
            <EventFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={refresh}
                editEvent={editingEvent}
                initialData={editingEvent ? undefined : createInitialData}
            />
        </aside>
    );
}
