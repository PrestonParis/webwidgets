'use client';

import {
    CalendarEvent,
    eventColor,
    formatEventTime,
    isAllDay,
} from '@/features/calendar/types/calendar';

export function EventDot({ event }: { event: CalendarEvent }) {
    return (
        <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${eventColor(event.colorId)}`}
            title={event.summary}
        />
    );
}

interface DayCellProps {
    date: Date;
    events: CalendarEvent[];
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    onClick: () => void;
}
export function DayCell({
    date,
    events,
    isCurrentMonth,
    isToday,
    isSelected,
    onClick,
}: DayCellProps) {
    const visible = events.slice(0, 3);
    const overflow = events.length - 3;
    return (
        <button
            onClick={onClick}
            className={`group relative min-h-[72px] p-2 rounded-xl text-left transition-colors ${isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-zinc-800/60' : 'opacity-40'} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700' : ''}`}
        >
            <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-zinc-300'} ${isSelected && !isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
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
