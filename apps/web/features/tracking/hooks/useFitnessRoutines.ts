'use client';
import { apiRouteFetch } from '@/lib/api/client';
import { useState, useEffect, useCallback } from 'react';

export interface FitnessRoutine {
    id: string;
    name: string;
    description?: string;
    exercises: {
        name: string;
        sets?: number;
        reps?: number;
        weight?: number;
        unit?: string;
        notes?: string;
    }[];
    tags: string[];
    duration_minutes?: number;
    created_at: string;
}

export function useFitnessRoutines() {
    const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiRouteFetch('/api/fitness/routines');
            if (!res.ok) return;
            const { routines: data } = (await res.json()) as {
                routines: FitnessRoutine[];
            };
            setRoutines(data ?? []);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const create = useCallback(
        async (routine: Omit<FitnessRoutine, 'id' | 'created_at'>) => {
            const res = await apiRouteFetch('/api/fitness/routines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(routine),
            });
            if (!res.ok) return null;
            const { routine: created } = (await res.json()) as {
                routine: FitnessRoutine;
            };
            setRoutines((prev) => [created, ...prev]);
            return created;
        },
        [],
    );

    const remove = useCallback(async (id: string) => {
        await apiRouteFetch(`/api/fitness/routines/${id}`, {
            method: 'DELETE',
        });
        setRoutines((prev) => prev.filter((r) => r.id !== id));
    }, []);

    return { routines, loading, create, remove, refetch: load };
}
