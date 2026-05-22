import { useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Habit, HabitCompletion } from '@/features/habit/types/habit';
import { toIsoDate } from '@/features/habit/hooks/useHabits.utils';

export function useHabitActions(params: {
    userId?: string | undefined;
    completions: HabitCompletion[];
    setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
    setCompletions: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
}) {
    const { userId, completions, setHabits, setCompletions } = params;

    const addHabit = useCallback(
        async (name: string, emoji: string) => {
            if (!userId || !name.trim()) return;
            const { data, error } = await supabase
                .from('habits')
                .insert({ user_id: userId, name: name.trim(), emoji })
                .select('id, name, emoji, created_at')
                .single();
            if (!error && data) setHabits((prev) => [...prev, data]);
        },
        [userId, setHabits],
    );

    const deleteHabit = useCallback(
        async (id: string) => {
            await supabase.from('habits').delete().eq('id', id);
            setHabits((prev) => prev.filter((h) => h.id !== id));
            setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
        },
        [setHabits, setCompletions],
    );

    const toggleCompletion = useCallback(
        async (habitId: string) => {
            if (!userId) return;
            const today = toIsoDate(new Date());
            const existing = completions.find(
                (c) => c.habit_id === habitId && c.completed_date === today,
            );

            if (existing) {
                await supabase
                    .from('habit_completions')
                    .delete()
                    .eq('id', existing.id);
                setCompletions((prev) =>
                    prev.filter((c) => c.id !== existing.id),
                );
            } else {
                const { data, error } = await supabase
                    .from('habit_completions')
                    .insert({
                        habit_id: habitId,
                        user_id: userId,
                        completed_date: today,
                    })
                    .select('id, habit_id, completed_date')
                    .single();
                if (!error && data) setCompletions((prev) => [...prev, data]);
            }
        },
        [userId, completions, setCompletions],
    );

    const isCompletedToday = useCallback(
        (habitId: string) => {
            const today = toIsoDate(new Date());
            return completions.some(
                (c) => c.habit_id === habitId && c.completed_date === today,
            );
        },
        [completions],
    );

    return { addHabit, deleteHabit, toggleCompletion, isCompletedToday };
}
