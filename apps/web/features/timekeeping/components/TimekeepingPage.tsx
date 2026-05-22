'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { ModePicker } from '@/features/timekeeping/components/ModePicker';
import {
    PomodoroMode,
    TimerMode,
} from '@/features/timekeeping/components/TimerMode';
import { StopwatchMode } from '@/features/timekeeping/components/StopwatchMode';
import { EventMode } from '@/features/timekeeping/components/EventMode';
import { WorldClockPage } from '@/features/worldclock/components/WorldClockPage';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

export function TimekeepingPage({
    initialMode = 'timer',
}: {
    initialMode?: TimekeepingMode;
}) {
    const [mode, setMode] = useState<TimekeepingMode>(initialMode);
    const wide = mode === 'worldclock';

    return (
        <main
            className={
                wide
                    ? 'max-w-5xl mx-auto px-6 py-12 lg:px-12'
                    : 'max-w-lg mx-auto px-6 py-12'
            }
        >
            <div className="flex items-center gap-3 mb-10 justify-center">
                <Clock size={22} className="text-blue-500" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Time
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 p-8">
                <div className="flex flex-col items-center w-full gap-6">
                    <ModePicker mode={mode} onChange={setMode} />
                    {mode === 'timer' && <TimerMode />}
                    {mode === 'pomodoro' && <PomodoroMode />}
                    {mode === 'stopwatch' && <StopwatchMode />}
                    {mode === 'countdown' && <EventMode />}
                    {mode === 'worldclock' && <WorldClockPage embedded />}
                </div>
            </div>
        </main>
    );
}
