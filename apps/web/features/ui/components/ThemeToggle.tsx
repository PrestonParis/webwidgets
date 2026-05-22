'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/features/ui/hooks/useTheme';

export function ThemeToggle() {
    const { isDark, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}
