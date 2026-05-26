import type {
    HabitCompletion,
    CalendarDay,
    RepeatConfig,
} from '@/features/habit/types/habit';

function toDateOnly(s: string): string {
    return s.slice(0, 10);
}

function formatTime(isoStr: string): string {
    if (!isoStr.includes('T')) return '';
    return new Date(isoStr).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function getStreak(
    habitId: string,
    completions: HabitCompletion[],
): number {
    const dates = [
        ...new Set(
            completions
                .filter((c) => c.habit_id === habitId)
                .map((c) => toDateOnly(c.completed_date)),
        ),
    ]
        .sort()
        .reverse();

    if (dates.length === 0) return 0;

    const today = toDateOnly(new Date().toISOString());
    const yesterday = toDateOnly(
        new Date(Date.now() - 86_400_000).toISOString(),
    );

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const prevDate = dates[i - 1];
        const currDate = dates[i];
        if (!prevDate || !currDate) break;
        const prev = new Date(prevDate).getTime();
        const curr = new Date(currDate).getTime();
        if (Math.round((prev - curr) / 86_400_000) === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export function getBestStreak(
    habitId: string,
    completions: HabitCompletion[],
): number {
    const dates = [
        ...new Set(
            completions
                .filter((c) => c.habit_id === habitId)
                .map((c) => toDateOnly(c.completed_date)),
        ),
    ]
        .sort()
        .reverse();

    if (dates.length === 0) return 0;

    let best = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
        const prevDate = dates[i - 1];
        const currDate = dates[i];
        if (!prevDate || !currDate) break;
        const prev = new Date(prevDate).getTime();
        const curr = new Date(currDate).getTime();
        if (Math.round((prev - curr) / 86_400_000) === 1) {
            current++;
            if (current > best) best = current;
        } else {
            current = 1;
        }
    }
    return best;
}

export function getLastCompleted(
    habitId: string,
    completions: HabitCompletion[],
): string | null {
    const sorted = completions
        .filter((c) => c.habit_id === habitId)
        .sort((a, b) => b.completed_date.localeCompare(a.completed_date));
    return sorted[0]?.completed_date ?? null;
}

export function getLastCompletedLabel(
    habitId: string,
    completions: HabitCompletion[],
): string {
    const last = getLastCompleted(habitId, completions);
    if (!last) return 'Never logged';

    const today = toDateOnly(new Date().toISOString());
    const yesterday = toDateOnly(
        new Date(Date.now() - 86_400_000).toISOString(),
    );
    const lastDate = toDateOnly(last);
    const timeStr = formatTime(last);

    if (lastDate === today)
        return timeStr ? `Logged today at ${timeStr}` : 'Logged today';
    if (lastDate === yesterday)
        return timeStr ? `Yesterday at ${timeStr}` : 'Yesterday';

    const daysDiff = Math.round(
        (new Date(today).getTime() - new Date(lastDate).getTime()) / 86_400_000,
    );
    return `${daysDiff}d ago`;
}

export function isDueToday(repeatConfig: RepeatConfig | undefined): boolean {
    if (!repeatConfig || repeatConfig.frequency === 'daily') return true;
    const day = new Date().getDay();
    if (repeatConfig.frequency === 'weekdays') return day >= 1 && day <= 5;
    if (repeatConfig.frequency === 'weekends') return day === 0 || day === 6;
    if (repeatConfig.frequency === 'custom') {
        return repeatConfig.daysOfWeek?.includes(day) ?? false;
    }
    return true;
}

export function frequencyLabel(config: RepeatConfig | undefined): string {
    if (!config || config.frequency === 'daily') return 'Daily';
    if (config.frequency === 'weekdays') return 'Weekdays';
    if (config.frequency === 'weekends') return 'Weekends';
    if (config.frequency === 'custom' && config.daysOfWeek?.length) {
        const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return config.daysOfWeek.map((d) => names[d]).join(', ');
    }
    return 'Custom';
}

export function buildCalendarMonth(
    year: number,
    month: number, // 0-indexed
    habitId: string,
    completions: HabitCompletion[],
): CalendarDay[] {
    const today = toDateOnly(new Date().toISOString());
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start grid on the Monday before the first day of the month
    const startDow = firstDay.getDay();
    const daysBack = startDow === 0 ? 6 : startDow - 1;
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - daysBack);

    // End grid on the Sunday after the last day
    const endDow = lastDay.getDay();
    const daysForward = endDow === 0 ? 0 : 7 - endDow;
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + daysForward);

    const days: CalendarDay[] = [];
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
        const dateStr = toDateOnly(cursor.toISOString());
        const count = completions.filter(
            (c) =>
                c.habit_id === habitId &&
                toDateOnly(c.completed_date) === dateStr,
        ).length;
        days.push({
            date: dateStr,
            count,
            isToday: dateStr === today,
            isCurrentMonth: cursor.getMonth() === month,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
}

/** Convert ISO datetime to datetime-local input value (local time, no seconds) */
export function toDatetimeLocalValue(isoStr: string): string {
    if (!isoStr.includes('T')) {
        return `${isoStr}T12:00`;
    }
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
