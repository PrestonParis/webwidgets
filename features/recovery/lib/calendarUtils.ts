import { DayStatus } from '@/features/recovery/types/recovery';

export const STATUS_CLASSES: Record<DayStatus, string> = {
    clean: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    relapse: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    future: 'text-gray-300 dark:text-zinc-700',
    before: 'text-gray-200 dark:text-zinc-800 opacity-40',
};

export function getDayStatus(
    day: number,
    year: number,
    month: number,
    today: Date,
    startTime: string | null,
    relapses: string[],
): DayStatus {
    const date = new Date(year, month, day);
    if (date > today) return 'future';
    if (!startTime || date < new Date(startTime)) return 'before';
    const dateStr = date.toISOString().split('T')[0];
    if (relapses.includes(dateStr)) return 'relapse';
    return 'clean';
}
