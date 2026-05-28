'use client';

import type { Habit } from '@/features/habit/types/habit';

interface HabitArchivePanelProps {
    habits: Habit[];
    activeEvents: Habit[];
    archivedEvents: Habit[];
    archiveHabit: (id: string) => Promise<void> | void;
    unarchiveHabit: (id: string) => Promise<void> | void;
}

export function HabitArchivePanel({
    habits,
    activeEvents,
    archivedEvents,
    archiveHabit,
    unarchiveHabit,
}: HabitArchivePanelProps) {
    return (
        <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                Archive Events
            </p>
            {habits.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-zinc-500">
                    No events yet.
                </p>
            ) : (
                <>
                    {activeEvents.map((habit) => (
                        <div key={habit.id} className="flex items-center gap-2">
                            <span className="text-sm">{habit.emoji}</span>
                            <span className="flex-1 text-xs text-stone-700 dark:text-zinc-200 truncate">
                                {habit.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => void archiveHabit(habit.id)}
                                className="rounded-full px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition-colors"
                            >
                                Archive
                            </button>
                        </div>
                    ))}
                    {archivedEvents.length > 0 && (
                        <>
                            <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 pt-1">
                                Archived
                            </p>
                            {archivedEvents.map((habit) => (
                                <div
                                    key={habit.id}
                                    className="flex items-center gap-2 opacity-60"
                                >
                                    <span className="text-sm">
                                        {habit.emoji}
                                    </span>
                                    <span className="flex-1 text-xs text-stone-500 dark:text-zinc-400 truncate line-through">
                                        {habit.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void unarchiveHabit(habit.id)
                                        }
                                        className="rounded-full px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition-colors"
                                    >
                                        Restore
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
