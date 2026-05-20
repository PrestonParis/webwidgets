'use client';

import { Timer } from 'lucide-react';
import { usePomodoroTimer } from '@/features/pomodoro/hooks/usePomodoroTimer';
import { ModeSelector } from '@/features/pomodoro/components/ModeSelector';
import { TimerDisplay } from '@/features/pomodoro/components/TimerDisplay';
import { TimerControls } from '@/features/pomodoro/components/TimerControls';
import { TimerStats } from '@/features/pomodoro/components/TimerStats';

export function PomodoroPage() {
    const {
        state,
        mins,
        secs,
        radius,
        circumference,
        strokeDashoffset,
        switchMode,
        reset,
        toggleRunning,
    } = usePomodoroTimer(false);

    return (
        <main className="max-w-lg mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-10 justify-center">
                <Timer size={22} className="text-red-500" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Pomodoro Timer
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 p-10 flex flex-col items-center gap-8">
                <ModeSelector mode={state.mode} onSwitch={switchMode} />
                <TimerDisplay
                    mins={mins}
                    secs={secs}
                    mode={state.mode}
                    cycles={state.cycles}
                    radius={radius}
                    circumference={circumference}
                    strokeDashoffset={strokeDashoffset}
                    compact={false}
                />
                <TimerControls
                    running={state.running}
                    onToggle={toggleRunning}
                    onReset={reset}
                />
                <TimerStats cycles={state.cycles} />
            </div>
        </main>
    );
}
