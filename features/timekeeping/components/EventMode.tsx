'use client';

import { useState } from 'react';
import { CalendarClock, Plus, Calendar } from 'lucide-react';
import { useCountdowns } from '@/features/countdown/hooks/useCountdowns';
import { useTick } from '@/lib/tick';
import CountdownHero from '@/features/countdown/components/CountdownHero';
import CountdownList from '@/features/countdown/components/CountdownList';
import AddForm from '@/features/countdown/components/AddForm';

export function EventMode() {
    const { countdowns, loading, addCountdown, deleteCountdown } =
        useCountdowns();
    const now = useTick();
    const [adding, setAdding] = useState(false);
    const [calendarPrompt, setCalendarPrompt] = useState<string | null>(null);

    const upcoming = countdowns.filter(
        (c) => new Date(c.target_date).getTime() > now,
    );
    const nearest = upcoming[0] ?? null;
    const rest = upcoming.slice(1);

    const handleAdd = async (name: string, date: string, emoji: string) => {
        await addCountdown(name, date, emoji);
        setAdding(false);
        setCalendarPrompt(name);
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            {loading ? (
                <div className="h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
                <>
                    {nearest ? (
                        <CountdownHero
                            countdown={nearest}
                            onDelete={(id) => void deleteCountdown(id)}
                        />
                    ) : (
                        !adding && (
                            <div className="flex flex-col items-center gap-2 py-3 text-stone-400 dark:text-zinc-600">
                                <CalendarClock
                                    size={24}
                                    className="opacity-40"
                                />
                                <p className="text-xs">No upcoming events.</p>
                            </div>
                        )
                    )}

                    <CountdownList
                        countdowns={rest}
                        onDelete={(id) => void deleteCountdown(id)}
                    />

                    {/* Calendar sync prompt */}
                    {calendarPrompt && (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 text-xs">
                            <Calendar
                                size={12}
                                className="text-blue-500 shrink-0"
                            />
                            <span className="text-blue-700 dark:text-blue-300 flex-1 truncate">
                                Add &quot;{calendarPrompt}&quot; to Calendar?
                            </span>
                            <button
                                onClick={() => setCalendarPrompt(null)}
                                className="text-blue-500 font-medium hover:text-blue-700 dark:hover:text-blue-200 shrink-0"
                            >
                                Soon
                            </button>
                            <button
                                onClick={() => setCalendarPrompt(null)}
                                className="text-stone-400 hover:text-stone-600 shrink-0"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {adding ? (
                        <AddForm
                            onAdd={handleAdd}
                            onCancel={() => setAdding(false)}
                        />
                    ) : (
                        <button
                            onClick={() => setAdding(true)}
                            className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                        >
                            <Plus size={12} /> Add event
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
