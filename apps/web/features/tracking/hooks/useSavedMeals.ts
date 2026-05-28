'use client';

import { useState, useCallback } from 'react';
import { localSavedMealStore } from '@/features/tracking/lib/meal/nutrition/savedMealStore';
import type {
    SavedMealDraft,
    SavedMealRecord,
} from '@/features/tracking/types/savedMeals';

export function useSavedMeals(): {
    savedMeals: SavedMealRecord[];
    create: (draft: SavedMealDraft) => SavedMealRecord;
    update: (id: string, draft: SavedMealDraft) => SavedMealRecord | null;
    remove: (id: string) => void;
    reload: () => void;
} {
    const [savedMeals, setSavedMeals] = useState<SavedMealRecord[]>(() =>
        localSavedMealStore.list(),
    );

    const reload = useCallback(() => {
        setSavedMeals(localSavedMealStore.list());
    }, []);

    const create = useCallback(
        (draft: SavedMealDraft) => {
            const m = localSavedMealStore.create(draft);
            reload();
            return m;
        },
        [reload],
    );

    const update = useCallback(
        (id: string, draft: SavedMealDraft) => {
            const m = localSavedMealStore.update(id, draft);
            reload();
            return m;
        },
        [reload],
    );

    const remove = useCallback(
        (id: string) => {
            localSavedMealStore.remove(id);
            reload();
        },
        [reload],
    );

    return { savedMeals, create, update, remove, reload };
}
