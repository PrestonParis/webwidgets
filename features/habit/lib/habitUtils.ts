import { HabitCompletion } from '@/features/habit/types/habit';

export function getStreak(
    habitId: string,
    completions: HabitCompletion[],
): number {
    const dates = completions
        .filter((c) => c.habit_id === habitId)
        .map((c) => c.completed_date)
        .sort()
        .reverse();

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86_400_000)
        .toISOString()
        .split('T')[0];

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
