'use client';

import { useState } from 'react';

export const THEMES = {
    purple: {
        pill: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        fill: '#7c3aed',
        stroke: '#a78bfa',
    },
    emerald: {
        pill: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        fill: '#059669',
        stroke: '#34d399',
    },
    blue: {
        pill: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        fill: '#2563eb',
        stroke: '#60a5fa',
    },
    rose: {
        pill: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        fill: '#e11d48',
        stroke: '#fb7185',
    },
    amber: {
        pill: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        fill: '#d97706',
        stroke: '#fbbf24',
    },
} as const;

export type ThemeKey = keyof typeof THEMES;
export type TrackerSize = 'compact' | 'default';

export function useTrackerTheme(trackerId: string) {
    const themeKey = `recovery_theme_${trackerId}`;
    const sizeKey = `recovery_size_${trackerId}`;

    const [theme, setThemeState] = useState<ThemeKey>(() => {
        if (typeof window === 'undefined') return 'purple';
        return (localStorage.getItem(themeKey) as ThemeKey) ?? 'purple';
    });
    const [size, setSizeState] = useState<TrackerSize>(() => {
        if (typeof window === 'undefined') return 'default';
        return (localStorage.getItem(sizeKey) as TrackerSize) ?? 'default';
    });
    const [showPicker, setShowPicker] = useState(false);

    const setTheme = (t: ThemeKey) => {
        setThemeState(t);
        localStorage.setItem(themeKey, t);
        setShowPicker(false);
    };
    const setSize = (s: TrackerSize) => {
        setSizeState(s);
        localStorage.setItem(sizeKey, s);
    };

    return { theme, setTheme, size, setSize, showPicker, setShowPicker };
}
