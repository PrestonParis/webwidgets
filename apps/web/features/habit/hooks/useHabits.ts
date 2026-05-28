'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
    Habit,
    HabitCompletion,
    RepeatConfig,
} from '@/features/habit/types/habit';
import {
    getStreak,
    getBestStreak,
    getLastCompleted,
    getLastCompletedLabel,
    buildCalendarMonth,
} from '@/features/habit/lib/habitUtils';
import { useHabitActions } from '@/features/habit/hooks/useHabitActions';
import {
    buildLastNDays,
    fetchHabitsAndCompletions,
    getThirtyDaysAgoIsoDate,
} from '@/features/habit/hooks/useHabits.utils';
import { supabase } from '@/lib/db/supabase';
import { toIsoDate } from '@/features/habit/hooks/useHabits.utils';

function loadSet(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch {
        return new Set();
    }
}

function saveSet(key: string, set: Set<string>) {
    localStorage.setItem(key, JSON.stringify([...set]));
}

function loadRecord<T>(key: string): Record<string, T> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, T>;
    } catch {
        return {};
    }
}

function saveRecord<T>(key: string, record: Record<string, T>) {
    localStorage.setItem(key, JSON.stringify(record));
}

export function useHabits() {
    const { user } = useAuth();
    const userId = user?.id;
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
    const [repeatConfigs, setRepeatConfigsState] = useState<
        Record<string, RepeatConfig>
    >({});

    useEffect(() => {
        if (!userId) return;
        const timeoutId = window.setTimeout(() => {
            const archiveKey = `habit_archived_${userId}`;
            const repeatKey = `habit_repeats_${userId}`;
            setArchivedIds(loadSet(archiveKey));
            setRepeatConfigsState(loadRecord<RepeatConfig>(repeatKey));
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        void (async () => {
            const thirtyDaysAgo = getThirtyDaysAgoIsoDate();
            const res = await fetchHabitsAndCompletions(userId, thirtyDaysAgo);

            if (!cancelled) {
                setHabits(res.habits);
                setCompletions(res.completions);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const {
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        updateCompletionTime,
    } = useHabitActions({
        userId,
        completions,
        setHabits,
        setCompletions,
    });

    const archiveHabit = useCallback(
        (id: string) => {
            if (!userId) return;
            const key = `habit_archived_${userId}`;
            setArchivedIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                saveSet(key, next);
                return next;
            });
        },
        [userId],
    );

    const unarchiveHabit = useCallback(
        (id: string) => {
            if (!userId) return;
            const key = `habit_archived_${userId}`;
            setArchivedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                saveSet(key, next);
                return next;
            });
        },
        [userId],
    );

    const setRepeatConfig = useCallback(
        (habitId: string, config: RepeatConfig) => {
            if (!userId) return;
            const key = `habit_repeats_${userId}`;
            setRepeatConfigsState((prev) => {
                const next = { ...prev, [habitId]: config };
                saveRecord(key, next);
                return next;
            });
        },
        [userId],
    );

    const importHabits = useCallback(
        async (names: string[]) => {
            if (!userId) return [];
            const trimmed = names.map((n) => n.trim()).filter(Boolean);
            const created: Habit[] = [];
            for (const name of trimmed) {
                const { data, error } = await supabase
                    .from('habits')
                    .insert({ user_id: userId, name, emoji: '✅' })
                    .select('id, name, emoji, created_at')
                    .single();
                if (!error && data) {
                    const habit = data as Habit;
                    created.push(habit);
                    setHabits((prev) => [...prev, habit]);
                }
            }
            return created;
        },
        [userId],
    );

    const getAllCompletions = useCallback(async () => {
        if (!userId) return completions;
        const { data } = await supabase
            .from('habit_completions')
            .select('id, habit_id, completed_date')
            .eq('user_id', userId);
        return (data ?? []) as HabitCompletion[];
    }, [userId, completions]);

    const getHabitStreak = useCallback(
        (habitId: string) => getStreak(habitId, completions),
        [completions],
    );

    const getHabitBestStreak = useCallback(
        (habitId: string) => getBestStreak(habitId, completions),
        [completions],
    );

    const getHabitLastCompleted = useCallback(
        (habitId: string) => getLastCompleted(habitId, completions),
        [completions],
    );

    const getHabitLastCompletedLabel = useCallback(
        (habitId: string) => getLastCompletedLabel(habitId, completions),
        [completions],
    );

    const getLast7Days = useCallback(
        (habitId: string) => buildLastNDays(7, habitId, completions),
        [completions],
    );

    const getCalendarMonth = useCallback(
        (year: number, month: number, habitId: string) =>
            buildCalendarMonth(year, month, habitId, completions),
        [completions],
    );

    const getCompletionToday = useCallback(
        (habitId: string): HabitCompletion | undefined => {
            const today = toIsoDate(new Date());
            return completions.find(
                (c) =>
                    c.habit_id === habitId &&
                    c.completed_date.slice(0, 10) === today,
            );
        },
        [completions],
    );

    const addCompletionForDate = useCallback(
        async (habitId: string, date: string) => {
            if (!userId) return;
            const existing = completions.find(
                (c) =>
                    c.habit_id === habitId &&
                    c.completed_date.slice(0, 10) === date.slice(0, 10),
            );
            if (!existing) {
                const { data, error } = await supabase
                    .from('habit_completions')
                    .insert({
                        habit_id: habitId,
                        user_id: userId,
                        completed_date: date,
                    })
                    .select('id, habit_id, completed_date')
                    .single();
                if (!error && data)
                    setCompletions((prev) => [
                        ...prev,
                        data as HabitCompletion,
                    ]);
            }
        },
        [userId, completions],
    );

    return {
        habits,
        completions,
        loading,
        archivedIds,
        repeatConfigs,
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        archiveHabit,
        unarchiveHabit,
        setRepeatConfig,
        importHabits,
        getAllCompletions,
        getHabitStreak,
        getHabitBestStreak,
        getHabitLastCompleted,
        getHabitLastCompletedLabel,
        getLast7Days,
        getCalendarMonth,
        getCompletionToday,
        updateCompletionTime,
        addCompletionForDate,
    };
}
