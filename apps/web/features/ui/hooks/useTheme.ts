'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

function getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
    return theme === 'system' ? getSystemPreference() : theme;
}

function applyTheme(resolved: 'light' | 'dark') {
    if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('system');

    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        const initial = saved ?? 'system';
        setThemeState(initial);
        applyTheme(resolveTheme(initial));

        if (initial === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, []);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        localStorage.setItem('theme', next);
        applyTheme(resolveTheme(next));
    }, []);

    const toggle = useCallback(() => {
        const resolved = resolveTheme(theme);
        setTheme(resolved === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    const isDark = resolveTheme(theme) === 'dark';

    return { theme, setTheme, toggle, isDark };
}
