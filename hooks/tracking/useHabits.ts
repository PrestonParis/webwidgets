'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

export interface Habit {
    id: string;
    name: string;
    emoji: string;
    created_at: string;
}

export interface HabitCompletion {
    id: string;
    habit_id: string;
    completed_date: string;
}

function getStreak(habitId: string, completions: HabitCompletion[]): number {
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
        const prev = new Date(dates[i - 1]).getTime();
        const curr = new Date(dates[i]).getTime();
        if (Math.round((prev - curr) / 86_400_000) === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export function useHabits() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)
                .toISOString()
                .split('T')[0];

            const [habitsRes, completionsRes] = await Promise.all([
                supabase
                    .from('habits')
                    .select('id, name, emoji, created_at')
                    .eq('user_id', user!.id)
                    .order('created_at'),
                supabase
                    .from('habit_completions')
                    .select('id, habit_id, completed_date')
                    .eq('user_id', user!.id)
                    .gte('completed_date', thirtyDaysAgo),
            ]);

            if (!cancelled) {
                setHabits(habitsRes.data || []);
                setCompletions(completionsRes.data || []);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const addHabit = useCallback(
        async (name: string, emoji: string) => {
            if (!user?.id || !name.trim()) return;
            const { data, error } = await supabase
                .from('habits')
                .insert({ user_id: user.id, name: name.trim(), emoji })
                .select('id, name, emoji, created_at')
                .single();
            if (!error && data) setHabits((prev) => [...prev, data]);
        },
        [user],
    );

    const deleteHabit = useCallback(async (id: string) => {
        await supabase.from('habits').delete().eq('id', id);
        setHabits((prev) => prev.filter((h) => h.id !== id));
        setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
    }, []);

    const toggleCompletion = useCallback(
        async (habitId: string) => {
            if (!user?.id) return;
            const today = new Date().toISOString().split('T')[0];
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
                        user_id: user.id,
                        completed_date: today,
                    })
                    .select('id, habit_id, completed_date')
                    .single();
                if (!error && data) setCompletions((prev) => [...prev, data]);
            }
        },
        [user, completions],
    );

    const isCompletedToday = useCallback(
        (habitId: string) => {
            const today = new Date().toISOString().split('T')[0];
            return completions.some(
                (c) => c.habit_id === habitId && c.completed_date === today,
            );
        },
        [completions],
    );

    const getHabitStreak = useCallback(
        (habitId: string) => getStreak(habitId, completions),
        [completions],
    );

    const getLast7Days = useCallback(
        (habitId: string) => {
            const days: { date: string; done: boolean }[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86_400_000)
                    .toISOString()
                    .split('T')[0];
                const done = completions.some(
                    (c) => c.habit_id === habitId && c.completed_date === date,
                );
                days.push({ date, done });
            }
            return days;
        },
        [completions],
    );

    return {
        habits,
        loading,
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        getHabitStreak,
        getLast7Days,
    };
}
