'use client';

import { Timer } from 'lucide-react';
import { PomodoroMode } from '@/features/timekeeping/components/TimerMode';

export function PomodoroPage() {
    return (
        <main className="max-w-lg mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-10 justify-center">
                <Timer size={22} className="text-red-500" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Pomodoro Timer
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 p-10 flex flex-col items-center gap-8">
                <PomodoroMode />
            </div>
        </main>
    );
}
