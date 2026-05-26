import { useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Habit, HabitCompletion } from '@/features/habit/types/habit';
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
            // Support both old (date-only) and new (ISO datetime) formats
            const existing = completions.find(
                (c) =>
                    c.habit_id === habitId &&
                    c.completed_date.slice(0, 10) === today,
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
                // Store full ISO timestamp so we can display and edit the time
                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('habit_completions')
                    .insert({
                        habit_id: habitId,
                        user_id: userId,
                        completed_date: now,
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
                (c) =>
                    c.habit_id === habitId &&
                    c.completed_date.slice(0, 10) === today,
            );
        },
        [completions],
    );

    const updateCompletionTime = useCallback(
        async (completionId: string, newIso: string) => {
            const { error } = await supabase
                .from('habit_completions')
                .update({ completed_date: newIso })
                .eq('id', completionId);
            if (!error) {
                setCompletions((prev) =>
                    prev.map((c) =>
                        c.id === completionId
                            ? { ...c, completed_date: newIso }
                            : c,
                    ),
                );
            }
        },
        [setCompletions],
    );

    return {
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        updateCompletionTime,
    };
}
