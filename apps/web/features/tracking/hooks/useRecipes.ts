'use client';

import { useState, useCallback } from 'react';
import { localRecipeStore } from '@/features/tracking/lib/meal/nutrition/recipeStore';
import type {
    RecipeDraft,
    RecipeRecord,
} from '@/features/tracking/types/nutritionRecipes';

export function useRecipes(): {
    recipes: RecipeRecord[];
    create: (draft: RecipeDraft) => RecipeRecord;
    update: (id: string, draft: RecipeDraft) => RecipeRecord | null;
    remove: (id: string) => void;
    reload: () => void;
} {
    const [recipes, setRecipes] = useState<RecipeRecord[]>(() =>
        localRecipeStore.list(),
    );

    const reload = useCallback(() => {
        setRecipes(localRecipeStore.list());
    }, []);

    const create = useCallback(
        (draft: RecipeDraft) => {
            const r = localRecipeStore.create(draft);
            reload();
            return r;
        },
        [reload],
    );

    const update = useCallback(
        (id: string, draft: RecipeDraft) => {
            const r = localRecipeStore.update(id, draft);
            reload();
            return r;
        },
        [reload],
    );

    const remove = useCallback(
        (id: string) => {
            localRecipeStore.remove(id);
            reload();
        },
        [reload],
    );

    return { recipes, create, update, remove, reload };
}
