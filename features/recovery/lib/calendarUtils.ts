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
    createdAt: string,
    relapses: string[],
): DayStatus {
    const date = new Date(year, month, day);
    if (date > today) return 'future';
    // Use the tracker's creation date as the history boundary, not the current
    // streak start — so relapse days before the latest reset remain visible.
    if (date < new Date(createdAt)) return 'before';
    const dateStr = `${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (relapses.includes(dateStr)) return 'relapse';
    return 'clean';
}
