'use client';

import { useEffect, useState } from 'react';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';

export default function AppearancePage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        // Check localStorage during initial render
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
        // Apply theme to document when it changes
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
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-6 lg:px-12 py-12 space-y-8">
                <div>
                    <h1 className="text-xl font-bold">Appearance</h1>
                    <p className="text-sm text-gray-500">
                        Customize how webwidgets looks
                    </p>
                </div>

                <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                    <p className="text-sm font-semibold">Theme</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleTheme('light')}
                            className={`px-4 py-2 rounded-xl text-sm border transition ${
                                theme === 'light'
                                    ? 'bg-gray-100 border-gray-300'
                                    : 'border-gray-200 dark:border-zinc-700'
                            }`}
                        >
                            Light
                        </button>

                        <button
                            onClick={() => toggleTheme('dark')}
                            className={`px-4 py-2 rounded-xl text-sm border transition ${
                                theme === 'dark'
                                    ? 'bg-zinc-800 text-white border-zinc-700'
                                    : 'border-gray-200 dark:border-zinc-700'
                            }`}
                        >
                            Dark
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
