'use client';

import { Trophy } from 'lucide-react';
import type { Habit } from '@/features/habit/types/habit';
import HabitEmptyState from './HabitEmptyState';

interface HabitStreaksViewProps {
    sortedByStreak: Habit[];
    getHabitStreak: (id: string) => number;
    getHabitBestStreak: (id: string) => number;
}

export function HabitStreaksView({
    sortedByStreak,
    getHabitStreak,
    getHabitBestStreak,
}: HabitStreaksViewProps) {
    if (sortedByStreak.length === 0)
        return <HabitEmptyState message="No events tracked yet." />;

    return (
        <div className="space-y-1">
            {sortedByStreak.map((habit) => {
                const streak = getHabitStreak(habit.id);
                const best = getHabitBestStreak(habit.id);
                return (
                    <div
                        key={habit.id}
                        className="flex items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2"
                    >
                        <Trophy className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className="text-base leading-none">
                            {habit.emoji}
                        </span>
                        <p className="flex-1 truncate text-xs font-medium text-stone-800 dark:text-zinc-100">
                            {habit.name}
                        </p>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400">
                                🔥 {streak}d
                            </span>
                            {best > streak && (
                                <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                                    best {best}d
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
