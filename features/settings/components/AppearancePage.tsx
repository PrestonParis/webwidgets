'use client';

import { useEffect, useState } from 'react';
import { BackgroundPickerPanel } from './BackgroundPickerPanel';

export default function AppearancePage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as
                | 'light'
                | 'dark'
                | null;
            if (saved) return saved;
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = (value: 'light' | 'dark') => {
        setTheme(value);
        localStorage.setItem('theme', value);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold">Appearance</h1>
                <p className="text-sm text-gray-500">
                    Customize how the app looks
                </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                <p className="text-sm font-semibold">Theme</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => toggleTheme('light')}
                        className={`px-4 py-2 rounded-xl text-sm border transition ${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 dark:border-zinc-700'}`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => toggleTheme('dark')}
                        className={`px-4 py-2 rounded-xl text-sm border transition ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-700' : 'border-gray-200 dark:border-zinc-700'}`}
                    >
                        Dark
                    </button>
                </div>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                <BackgroundPickerPanel />
            </div>
        </div>
    );
}
