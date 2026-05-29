import { supabase } from '@/lib/db/supabase';
import { Habit, HabitCompletion } from '@/features/habit/types/habit';

export function toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0] ?? '';
}

export function getThirtyDaysAgoIsoDate(): string {
    return toIsoDate(new Date(Date.now() - 30 * 86_400_000));
}

export async function fetchHabitsAndCompletions(
    userId: string,
    fromDate: string,
) {
    const [habitsRes, completionsRes] = await Promise.all([
        supabase
            .from('habits')
            .select('id, name, emoji, created_at')
            .eq('user_id', userId)
            .order('created_at'),
        supabase
            .from('habit_completions')
            .select('id, habit_id, completed_date')
            .eq('user_id', userId)
            .gte('completed_date', fromDate),
    ]);

    return {
        habits: (habitsRes.data || []) as Habit[],
        completions: (completionsRes.data || []) as HabitCompletion[],
    };
}

export function buildLastNDays(
    n: number,
    habitId: string,
    completions: HabitCompletion[],
) {
    const days: { date: string; done: boolean }[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = toIsoDate(new Date(Date.now() - i * 86_400_000));
        const done = completions.some(
            (c) =>
                c.habit_id === habitId &&
                c.completed_date.slice(0, 10) === date,
        );
        days.push({ date, done });
    }
    return days;
}
