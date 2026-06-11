'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarDay, Habit } from '@/features/habit/types/habit';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import HabitEmptyState from './HabitEmptyState';
import { cn } from '@/lib/utils/utils';

const MONTH_NAMES = [
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
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function intensityClass(count: number, isCurrentMonth: boolean) {
    if (!isCurrentMonth) return 'bg-transparent';
    if (count === 0) return 'bg-stone-100 dark:bg-zinc-800';
    if (count === 1) return 'bg-violet-200 dark:bg-violet-900/50';
    if (count === 2) return 'bg-violet-400 dark:bg-violet-600';
    return 'bg-violet-600 dark:bg-violet-400';
}

interface HabitCalendarViewProps {
    activeEvents: Habit[];
    getCalendarMonth: (
        year: number,
        month: number,
        habitId: string,
    ) => CalendarDay[];
}

export function HabitCalendarView({
    activeEvents,
    getCalendarMonth,
}: HabitCalendarViewProps) {
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calHabitIdx, setCalHabitIdx] = useState(0);
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);

    const calEvent = activeEvents[calHabitIdx] ?? activeEvents[0];
    const calDays = useMemo(
        () =>
            calEvent ? getCalendarMonth(calYear, calMonth, calEvent.id) : [],
        [calEvent, calYear, calMonth, getCalendarMonth],
    );

    if (activeEvents.length === 0)
        return <HabitEmptyState message="No events to show." />;

    return (
        <div className="space-y-2">
            {activeEvents.length > 1 && (
                <div className="flex gap-1 flex-wrap">
                    {activeEvents.map((h, i) => (
                        <button
                            key={h.id}
                            type="button"
                            onClick={() => setCalHabitIdx(i)}
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                calHabitIdx === i
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                            )}
                        >
                            {h.emoji} {h.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => {
                        if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear((y) => y - 1);
                        } else setCalMonth((m) => m - 1);
                    }}
                    className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => setShowCalendarPicker((v) => !v)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    {MONTH_NAMES[calMonth]} {calYear}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear((y) => y + 1);
                        } else setCalMonth((m) => m + 1);
                    }}
                    className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {showCalendarPicker && (
                <DatePicker
                    value={new Date(calYear, calMonth, 1).toISOString()}
                    onChange={(iso) => {
                        const d = new Date(iso);
                        setCalYear(d.getFullYear());
                        setCalMonth(d.getMonth());
                        setShowCalendarPicker(false);
                    }}
                    onCancel={() => setShowCalendarPicker(false)}
                    showQuickActions={false}
                    saveLabel="Show month"
                    accentColor="#7c3aed"
                    className="mx-auto"
                />
            )}

            <div className="grid grid-cols-7 gap-0.5">
                {DAY_LABELS.map((d) => (
                    <div
                        key={d}
                        className="text-center text-[9px] font-semibold text-stone-400 dark:text-zinc-500 pb-0.5"
                    >
                        {d}
                    </div>
                ))}
                {calDays.map((day) => (
                    <div
                        key={day.date}
                        title={`${day.date}: ${day.count} log${day.count !== 1 ? 's' : ''}`}
                        className={cn(
                            'aspect-square rounded-sm flex items-center justify-center text-[9px] transition-colors',
                            intensityClass(day.count, day.isCurrentMonth),
                            day.isToday && 'ring-1 ring-violet-500',
                            !day.isCurrentMonth &&
                                'opacity-0 pointer-events-none',
                        )}
                    >
                        {day.isCurrentMonth
                            ? new Date(day.date + 'T12:00:00').getDate()
                            : ''}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 justify-end">
                <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                    Less
                </span>
                {[0, 1, 2, 3].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            'w-3 h-3 rounded-sm',
                            level === 0 && 'bg-stone-100 dark:bg-zinc-800',
                            level === 1 &&
                                'bg-violet-200 dark:bg-violet-900/50',
                            level === 2 && 'bg-violet-400 dark:bg-violet-600',
                            level === 3 && 'bg-violet-600 dark:bg-violet-400',
                        )}
                    />
                ))}
                <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                    More
                </span>
            </div>
        </div>
    );
}
