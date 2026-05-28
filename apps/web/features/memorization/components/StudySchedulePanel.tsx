'use client';

import { CalendarClock } from 'lucide-react';

interface StudySchedulePanelProps {
    dueToday: number;
}

export function StudySchedulePanel({ dueToday }: StudySchedulePanelProps) {
    const dailyGoal = Math.max(20, dueToday);
    const eveningGoal = Math.ceil(dailyGoal / 2);

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Study Schedule
                </h2>
                <CalendarClock size={16} className="text-zinc-400" />
            </div>
            <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                    <span className="text-zinc-600 dark:text-zinc-300">
                        Daily Goals
                    </span>
                    <strong className="text-zinc-950 dark:text-zinc-50">
                        {dailyGoal} cards
                    </strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                    <span className="text-zinc-600 dark:text-zinc-300">
                        Morning Session
                    </span>
                    <strong className="text-zinc-950 dark:text-zinc-50">
                        {Math.floor(dailyGoal / 2)} cards
                    </strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                    <span className="text-zinc-600 dark:text-zinc-300">
                        Evening Session
                    </span>
                    <strong className="text-zinc-950 dark:text-zinc-50">
                        {eveningGoal} cards
                    </strong>
                </div>
            </div>
        </section>
    );
}
