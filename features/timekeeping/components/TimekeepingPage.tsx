'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { ModePicker } from '@/features/timekeeping/components/ModePicker';
import { TimerMode } from '@/features/timekeeping/components/TimerMode';
import { StopwatchMode } from '@/features/timekeeping/components/StopwatchMode';
import { EventMode } from '@/features/timekeeping/components/EventMode';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

export function TimekeepingPage() {
    const [mode, setMode] = useState<TimekeepingMode>('timer');

    return (
        <main className="max-w-lg mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-10 justify-center">
                <Clock size={22} className="text-blue-500" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Timekeeping
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 p-8">
                <div className="flex flex-col items-center w-full gap-6">
                    <ModePicker mode={mode} onChange={setMode} />
                    {mode === 'timer' && <TimerMode />}
                    {mode === 'stopwatch' && <StopwatchMode />}
                    {mode === 'event' && <EventMode />}
                </div>
            </div>
        </main>
    );
}
