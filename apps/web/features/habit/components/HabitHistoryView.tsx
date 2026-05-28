'use client';

import HabitEmptyState from './HabitEmptyState';

interface HistoryEntry {
    habitId: string;
    name: string;
    emoji: string;
    time: string;
}

interface HistoryGroup {
    date: string;
    entries: HistoryEntry[];
}

interface HabitHistoryViewProps {
    historyByDate: HistoryGroup[];
}

export function HabitHistoryView({ historyByDate }: HabitHistoryViewProps) {
    if (historyByDate.length === 0)
        return <HabitEmptyState message="No entries logged yet." />;

    return (
        <div className="space-y-2">
            {historyByDate.map((group) => (
                <div key={group.date}>
                    <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
                        {group.date}
                    </p>
                    <div className="space-y-0.5 rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                        {group.entries.map((e, i) => (
                            <div
                                key={`${e.habitId}-${i}`}
                                className="flex items-center gap-1.5"
                            >
                                <span className="text-xs">{e.emoji}</span>
                                <span className="text-xs text-stone-700 dark:text-zinc-300 truncate flex-1">
                                    {e.name}
                                </span>
                                {e.time && (
                                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 shrink-0">
                                        {e.time}
                                    </span>
                                )}
                                <span className="text-[10px] text-violet-500 shrink-0">
                                    ✓
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
