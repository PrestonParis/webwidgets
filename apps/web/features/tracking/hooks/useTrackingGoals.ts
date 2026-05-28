'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    TrackingGoal,
    GoalTargetType,
} from '@/features/tracking/types/goals';

export function useTrackingGoals(category?: string): {
    goal: TrackingGoal | null;
    allGoals: TrackingGoal[];
    upsert: (g: {
        targetType: GoalTargetType;
        metricKey?: string;
        targetValue: number;
    }) => Promise<void>;
    remove: () => Promise<void>;
    loading: boolean;
} {
    const [allGoals, setAllGoals] = useState<TrackingGoal[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tracking/goals');
            if (!res.ok) throw new Error('Failed to fetch goals');
            const { goals } = (await res.json()) as { goals: TrackingGoal[] };
            setAllGoals(goals ?? []);
        } catch {
            setAllGoals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void reload();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [reload]);

    const upsert = useCallback(
        async (g: {
            targetType: GoalTargetType;
            metricKey?: string;
            targetValue: number;
        }) => {
            if (!category) return;
            await fetch('/api/tracking/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, ...g }),
            });
            await reload();
        },
        [category, reload],
    );

    const remove = useCallback(async () => {
        if (!category) return;
        await fetch(`/api/tracking/goals/${encodeURIComponent(category)}`, {
            method: 'DELETE',
        });
        await reload();
    }, [category, reload]);

    const goal = category
        ? (allGoals.find((g) => g.category === category) ?? null)
        : null;

    return { goal, allGoals, upsert, remove, loading };
}
