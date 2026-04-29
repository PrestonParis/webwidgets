'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timer } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';

type Mode = 'focus' | 'short' | 'long';

const DURATIONS: Record<Mode, number> = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
};

const LABELS: Record<Mode, string> = {
    focus: 'Focus',
    short: 'Short Break',
    long: 'Long Break',
};

export default function PomodoroWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'pomodoro',
        'pomodoro',
    );
    const [mode, setMode] = useState<Mode>('focus');
    const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
    const [running, setRunning] = useState(false);
    const [cycles, setCycles] = useState(0);

    // Interval tick
    useEffect(() => {
        if (!running) return;
        const id = setInterval(
            () => setTimeLeft((t) => Math.max(0, t - 1)),
            1000,
        );
        return () => clearInterval(id);
    }, [running]);

    // Handle timer completion
    useEffect(() => {
        if (timeLeft !== 0 || !running) return;
        setRunning(false);

        if (Notification.permission === 'granted') {
            new Notification('Pomodoro', {
                body:
                    mode === 'focus'
                        ? 'Focus session complete! Time for a break.'
                        : 'Break over — back to focus.',
            });
        }

        if (mode === 'focus') {
            const nextCycles = cycles + 1;
            const nextMode: Mode = nextCycles % 4 === 0 ? 'long' : 'short';
            setCycles(nextCycles);
            setMode(nextMode);
            setTimeLeft(DURATIONS[nextMode]);
        } else {
            setMode('focus');
            setTimeLeft(DURATIONS.focus);
        }
    }, [timeLeft, running, mode, cycles]);

    const switchMode = useCallback((m: Mode) => {
        setMode(m);
        setTimeLeft(DURATIONS[m]);
        setRunning(false);
    }, []);

    const reset = useCallback(() => {
        setTimeLeft(DURATIONS[mode]);
        setRunning(false);
    }, [mode]);

    const requestNotify = useCallback(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    const progress = 1 - timeLeft / DURATIONS[mode];

    return (
        <WidgetShell
            icon={<Timer size={16} />}
            title="Pomodoro"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {/* Mode tabs */}
            <div className="flex gap-1 mb-5">
                {(['focus', 'short', 'long'] as Mode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => switchMode(m)}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                            mode === m
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : 'text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                        }`}
                    >
                        {LABELS[m]}
                    </button>
                ))}
            </div>

            {/* Timer face */}
            <div className="flex flex-col items-center gap-4 py-1">
                <div className="text-5xl font-mono font-bold text-stone-800 dark:text-zinc-100 tabular-nums tracking-tight">
                    {mins}:{secs}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setRunning((r) => !r);
                            requestNotify();
                        }}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        {running ? 'Pause' : 'Start'}
                    </button>
                    <button
                        onClick={reset}
                        className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-sm transition-colors"
                    >
                        Reset
                    </button>
                </div>

                <p className="text-xs text-stone-400 dark:text-zinc-600">
                    {cycles} session{cycles !== 1 ? 's' : ''} completed today
                </p>
            </div>
        </WidgetShell>
    );
}
