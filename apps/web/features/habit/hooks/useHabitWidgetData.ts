'use client';

// Adapter-backed replacement for useHabits() inside HabitWidget.
//
// Why a separate hook instead of updating useHabits:
// - useHabits is also used by HabitPage, which needs the full history and
//   management operations. HabitWidget only needs the last-30-days window.
// - useHabitWidgetData reads initial data from the runtime adapter payload
//   (useWidgetData → habitAdapter → habits + completions), keeping the widget
//   consistent with the manifest-driven data pipeline.
// - Local state mirrors the payload for optimistic mutation updates.
//   After each write, invalidateQueries triggers a background refetch that
//   eventually reconciles local state with the DB.

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';
import { supabase } from '@/lib/db/supabase';
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
import {
    buildLastNDays,
    toIsoDate,
} from '@/features/habit/hooks/useHabits.utils';

// ── localStorage helpers (duplicated from useHabits to avoid coupling) ────────

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

// ── Shape of the inlinePayload returned by habitAdapter ───────────────────────

interface HabitAdapterPayload {
    habits: Habit[];
    completions: HabitCompletion[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHabitWidgetData() {
    const { user } = useAuth();
    const userId = user?.id;
    const queryClient = useQueryClient();

    const { payload, loading } = useWidgetData('habit-widget', 'habit');

    // Local state mirrors adapter payload; mutations update it optimistically.
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
    const [repeatConfigs, setRepeatConfigsState] = useState<
        Record<string, RepeatConfig>
    >({});

    // Sync from adapter payload whenever TanStack Query delivers a fresh result.
    const adapterData = payload?.sources['habits']
        ?.data as HabitAdapterPayload | null;
    useEffect(() => {
        if (adapterData?.habits !== undefined) setHabits(adapterData.habits);
        if (adapterData?.completions !== undefined)
            setCompletions(adapterData.completions);
    }, [adapterData]);

    // Load client-side config from localStorage (archive state, repeat schedules).
    useEffect(() => {
        if (!userId) return;
        setArchivedIds(loadSet(`habit_archived_${userId}`));
        setRepeatConfigsState(
            loadRecord<RepeatConfig>(`habit_repeats_${userId}`),
        );
    }, [userId]);

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: ['widget-adapter', 'habits', 'current_user'],
        });
    }, [queryClient]);

    // ── Mutations ─────────────────────────────────────────────────────────────

    const addHabit = useCallback(
        async (name: string, emoji: string) => {
            if (!userId || !name.trim()) return;
            const { data, error } = await supabase
                .from('habits')
                .insert({ user_id: userId, name: name.trim(), emoji })
                .select('id, name, emoji, created_at')
                .single();
            if (!error && data) {
                setHabits((prev) => [...prev, data as Habit]);
                invalidate();
            }
        },
        [userId, invalidate],
    );

    const deleteHabit = useCallback(
        async (id: string) => {
            setHabits((prev) => prev.filter((h) => h.id !== id));
            setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
            await supabase.from('habits').delete().eq('id', id);
            invalidate();
        },
        [invalidate],
    );

    const toggleCompletion = useCallback(
        async (habitId: string) => {
            if (!userId) return;
            const today = toIsoDate(new Date());
            const existing = completions.find(
                (c) =>
                    c.habit_id === habitId &&
                    c.completed_date.slice(0, 10) === today,
            );
            if (existing) {
                setCompletions((prev) =>
                    prev.filter((c) => c.id !== existing.id),
                );
                await supabase
                    .from('habit_completions')
                    .delete()
                    .eq('id', existing.id);
            } else {
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
                if (!error && data)
                    setCompletions((prev) => [
                        ...prev,
                        data as HabitCompletion,
                    ]);
            }
            invalidate();
        },
        [userId, completions, invalidate],
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
                invalidate();
            }
        },
        [invalidate],
    );

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
            const created: Habit[] = [];
            for (const name of names.map((n) => n.trim()).filter(Boolean)) {
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
            if (created.length > 0) invalidate();
            return created;
        },
        [userId, invalidate],
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
                if (!error && data) {
                    setCompletions((prev) => [
                        ...prev,
                        data as HabitCompletion,
                    ]);
                    invalidate();
                }
            }
        },
        [userId, completions, invalidate],
    );

    // ── Derived read-only helpers ─────────────────────────────────────────────

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

    // getAllCompletions — widget uses this for export; fetches unbounded history
    const getAllCompletions = useCallback(async () => {
        if (!userId) return completions;
        const { data } = await supabase
            .from('habit_completions')
            .select('id, habit_id, completed_date')
            .eq('user_id', userId);
        return (data ?? []) as HabitCompletion[];
    }, [userId, completions]);

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
