'use client';

import { useState, useCallback } from 'react';
import { CUSTOM_CATEGORIES_KEY } from '@/features/tracking/constants';
import type {
    CustomCategoryDef,
    FieldDef,
} from '@/features/tracking/types/customCategories';

function slugify(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function load(): CustomCategoryDef[] {
    try {
        const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as CustomCategoryDef[];
    } catch {
        return [];
    }
}

function save(defs: CustomCategoryDef[]): void {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(defs));
}

export function useCustomCategories(): {
    customCategories: CustomCategoryDef[];
    addCategory: (
        label: string,
        emoji: string,
        color: string,
        fields: FieldDef[],
    ) => CustomCategoryDef;
    updateCategory: (
        id: string,
        updates: Partial<Omit<CustomCategoryDef, 'id' | 'createdAt'>>,
    ) => void;
    deleteCategory: (id: string) => void;
    getCategoryDef: (id: string) => CustomCategoryDef | undefined;
} {
    const [customCategories, setCustomCategories] = useState<
        CustomCategoryDef[]
    >(() => load());

    const addCategory = useCallback(
        (label: string, emoji: string, color: string, fields: FieldDef[]) => {
            const base = slugify(label);
            const existing = load();
            let id = base;
            let n = 1;
            while (existing.some((d) => d.id === id)) {
                id = `${base}-${n++}`;
            }
            const def: CustomCategoryDef = {
                id,
                label,
                emoji,
                color,
                fields,
                createdAt: new Date().toISOString(),
            };
            const updated = [...existing, def];
            save(updated);
            setCustomCategories(updated);
            return def;
        },
        [],
    );

    const updateCategory = useCallback(
        (
            id: string,
            updates: Partial<Omit<CustomCategoryDef, 'id' | 'createdAt'>>,
        ) => {
            setCustomCategories((prev) => {
                const updated = prev.map((d) =>
                    d.id === id ? { ...d, ...updates } : d,
                );
                save(updated);
                return updated;
            });
        },
        [],
    );

    const deleteCategory = useCallback((id: string) => {
        setCustomCategories((prev) => {
            const updated = prev.filter((d) => d.id !== id);
            save(updated);
            return updated;
        });
    }, []);

    const getCategoryDef = useCallback(
        (id: string) => {
            return customCategories.find((d) => d.id === id);
        },
        [customCategories],
    );

    return {
        customCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryDef,
    };
}
