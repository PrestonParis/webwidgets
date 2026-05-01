'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Habit, HabitCompletion } from '@/features/habit/types/habit';
import { getStreak } from '@/features/habit/lib/habitUtils';
import { useHabitActions } from '@/features/habit/hooks/useHabitActions';
import {
    buildLastNDays,
    fetchHabitsAndCompletions,
    getThirtyDaysAgoIsoDate,
} from '@/features/habit/hooks/useHabits.utils';

export function useHabits() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const thirtyDaysAgo = getThirtyDaysAgoIsoDate();
            const res = await fetchHabitsAndCompletions(user.id, thirtyDaysAgo);

            if (!cancelled) {
                setHabits(res.habits);
                setCompletions(res.completions);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const { addHabit, deleteHabit, toggleCompletion, isCompletedToday } =
        useHabitActions({
            userId: user?.id,
            completions,
            setHabits,
            setCompletions,
        });

    const getHabitStreak = useCallback(
        (habitId: string) => getStreak(habitId, completions),
        [completions],
    );

    const getLast7Days = useCallback(
        (habitId: string) => buildLastNDays(7, habitId, completions),
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
