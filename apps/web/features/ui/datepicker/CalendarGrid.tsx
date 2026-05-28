import { DAYS } from '@/lib/utils/time';
import { CalendarGridProps } from '../types/datepicker';

export function CalendarGrid({
    firstDay,
    daysInMonth,
    viewYear,
    viewMonth,
    today,
    sel,
    setSel,
    allowFuture = false,
}: CalendarGridProps) {
    return (
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
            {DAYS.map((d, i) => (
                <div
                    key={i}
                    className="text-center text-xs text-gray-400 dark:text-zinc-600 py-1 font-medium"
                >
                    {d}
                </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
                <div key={i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected =
                    day === sel.day &&
                    viewMonth === sel.month &&
                    viewYear === sel.year;
                const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();
                const isFuture = new Date(viewYear, viewMonth, day) > today;
                const isDisabled = !allowFuture && isFuture;

                return (
                    <div
                        key={day}
                        onClick={() => {
                            if (!isDisabled) setSel(day, viewMonth, viewYear);
                        }}
                        className={`text-center text-xs py-1.5 rounded-full transition-colors select-none
                            ${isDisabled ? 'text-gray-200 dark:text-zinc-800 cursor-default' : 'cursor-pointer'}
                            ${
                                isSelected
                                    ? 'bg-purple-600 text-white'
                                    : isToday
                                      ? 'text-purple-600 dark:text-purple-400 font-bold'
                                      : isDisabled
                                        ? ''
                                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
    );
}
