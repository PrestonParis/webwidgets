'use client';

import { useCallback, useState } from 'react';

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
    work: 'bg-blue-500',
    personal: 'bg-green-500',
    finance: 'bg-amber-500',
    promotions: 'bg-orange-400',
    social: 'bg-purple-500',
    notifications: 'bg-zinc-400',
    shopping: 'bg-pink-400',
    other: 'bg-zinc-300 dark:bg-zinc-600',
};

export const COLOR_PALETTE = [
    'bg-red-500',
    'bg-orange-400',
    'bg-amber-500',
    'bg-yellow-400',
    'bg-lime-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-400',
    'bg-rose-500',
    'bg-zinc-400',
];

const STORAGE_KEY = 'inbox-category-colors';

function load(): Record<string, string> {
    if (typeof window === 'undefined') return { ...DEFAULT_CATEGORY_COLORS };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_CATEGORY_COLORS, ...JSON.parse(raw) };
    } catch {
        // ignore
    }
    return { ...DEFAULT_CATEGORY_COLORS };
}

export function useCategoryColors() {
    const [colors, setColors] = useState<Record<string, string>>(load);

    const setColor = useCallback((category: string, color: string) => {
        setColors((prev) => {
            const next = { ...prev, [category]: color };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, []);

    const getColor = useCallback(
        (category: string): string =>
            colors[category] ??
            DEFAULT_CATEGORY_COLORS[category] ??
            'bg-zinc-400',
        [colors],
    );

    return { colors, getColor, setColor };
}
