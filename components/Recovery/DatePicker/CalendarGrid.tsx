import { DAYS } from './calendarUtils';
import { CalendarGridProps } from '@/types/recovery';

export function CalendarGrid({
    firstDay,
    daysInMonth,
    viewYear,
    viewMonth,
    today,
    sel,
    setSel,
}: CalendarGridProps) {
    return (
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
            {DAYS.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 py-1">
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

                return (
                    <div
                        key={day}
                        onClick={() => {
                            if (!isFuture) setSel(day, viewMonth, viewYear);
                        }}
                        className={`text-center text-xs py-1.5 rounded-full cursor-pointer
                            ${
                                isSelected
                                    ? 'bg-purple-600 text-white'
                                    : isToday
                                      ? 'text-purple-600 font-bold'
                                      : isFuture
                                        ? 'text-gray-200'
                                        : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
    );
}
