import type { ForecastDay } from '@/features/weather/types/weather';
import { cn } from '@/lib/utils/utils';

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(day: ForecastDay): string {
    if (day.isToday) return 'Today';
    const d = new Date(day.date + 'T12:00:00');
    return DAY_ABBREVS[d.getDay()] ?? day.date.slice(5);
}

interface Props {
    days: ForecastDay[];
}

export function WeatherForecastStrip({ days }: Props) {
    if (days.length === 0) return null;

    return (
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
            {days.map((day) => (
                <div
                    key={day.date}
                    className={cn(
                        'flex flex-col items-center min-w-[44px] shrink-0 py-1.5 px-1 rounded-lg',
                        day.isToday
                            ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/60'
                            : day.isPast
                              ? 'opacity-50'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                    )}
                >
                    <span
                        className={cn(
                            'text-[9px] font-semibold uppercase tracking-wide',
                            day.isToday
                                ? 'text-sky-600 dark:text-sky-400'
                                : 'text-zinc-400 dark:text-zinc-500',
                        )}
                    >
                        {dayLabel(day)}
                    </span>
                    <span className="text-base leading-none my-1">
                        {day.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
                        {day.tempMax}°
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                        {day.tempMin}°
                    </span>
                    {day.precipProbability >= 20 && (
                        <span className="text-[8px] text-blue-500 dark:text-blue-400 mt-0.5">
                            {day.precipProbability}%
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
