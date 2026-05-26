'use client';

import { useState, useEffect, useCallback } from 'react';
import { localRecipeStore } from '@/features/tracking/lib/meal/nutrition/recipeStore';
import type {
    RecipeDraft,
    RecipeRecord,
} from '@/features/tracking/lib/meal/nutrition/types';

export function useRecipes(): {
    recipes: RecipeRecord[];
    create: (draft: RecipeDraft) => RecipeRecord;
    update: (id: string, draft: RecipeDraft) => RecipeRecord | null;
    remove: (id: string) => void;
    reload: () => void;
} {
    const [recipes, setRecipes] = useState<RecipeRecord[]>([]);

    const reload = useCallback(() => {
        setRecipes(localRecipeStore.list());
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

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
