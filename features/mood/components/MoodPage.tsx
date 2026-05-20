'use client';

import { Smile } from 'lucide-react';
import { useMoodLog } from '@/features/mood/hooks/useMoodLog';
import { useMoodHistory } from '@/features/mood/hooks/useMoodHistory';
import { MOODS, DOT_COLORS } from '@/features/mood/constants';
import type { MoodEntry } from '@/features/mood/types/mood';
import LoadingState from '@/features/ui/components/LoadingState';

function MoodPicker({
    entries,
    today,
    onPick,
}: {
    entries: MoodEntry[];
    today: string;
    onPick: (v: number) => void;
}) {
    const todayEntry = entries.find((e) => e.logged_date === today);
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 p-6">
            <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300 mb-4">
                How are you feeling today?
            </p>
            <div className="flex gap-3">
                {MOODS.map((m) => (
                    <button
                        key={m.value}
                        onClick={() => onPick(m.value)}
                        title={m.label}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                            todayEntry?.score === m.value
                                ? `${m.color} border-current scale-105`
                                : 'border-transparent hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                            {m.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function MoodHistoryTable({ entries }: { entries: MoodEntry[] }) {
    if (entries.length === 0) return null;
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-zinc-800">
                <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
                    History
                </p>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-zinc-800">
                {entries.slice(0, 30).map((e) => {
                    const mood = MOODS.find((m) => m.value === e.score);
                    return (
                        <li
                            key={e.id}
                            className="flex items-center justify-between px-6 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[e.score] ?? 'bg-zinc-400'}`}
                                />
                                <span className="text-sm text-stone-600 dark:text-zinc-400">
                                    {e.logged_date}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {mood && (
                                    <span className="text-lg">
                                        {mood.emoji}
                                    </span>
                                )}
                                <span className="text-sm font-medium text-stone-800 dark:text-zinc-200">
                                    {mood?.label ?? e.score}
                                </span>
                                {e.note && (
                                    <span className="text-xs text-stone-400 dark:text-zinc-600 max-w-50 truncate">
                                        {e.note}
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export function MoodPage() {
    const { entries, loading, logMood } = useMoodLog();
    const { today } = useMoodHistory(entries);

    const handlePick = (value: number) => {
        void logMood(value);
    };

    if (loading) return <LoadingState />;

    return (
        <main className="max-w-2xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
                <Smile size={22} className="text-yellow-500" />
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                        Mood
                    </h1>
                    <p className="text-sm text-stone-500 dark:text-zinc-500">
                        {entries.length} entries logged
                    </p>
                </div>
            </div>
            <div className="space-y-6">
                <MoodPicker
                    entries={entries}
                    today={today}
                    onPick={handlePick}
                />
                <MoodHistoryTable entries={entries} />
            </div>
        </main>
    );
}
