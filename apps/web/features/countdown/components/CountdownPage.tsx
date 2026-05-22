'use client';

import { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { useCountdowns } from '@/features/countdown/hooks/useCountdowns';
import { useCountdownTimer } from '@/features/countdown/hooks/useCountdownTimer';
import CountdownHero from '@/features/countdown/components/CountdownHero';
import CountdownList from '@/features/countdown/components/CountdownList';
import AddForm from '@/features/countdown/components/AddForm';
import type { Countdown } from '@/features/countdown/types/countdown';

export function CountdownPage() {
    const { countdowns, loading, addCountdown, updateCountdown, deleteCountdown } =
        useCountdowns();
    const now = useCountdownTimer();
    const [adding, setAdding] = useState(false);
    const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(
        null,
    );

    const upcoming = countdowns.filter(
        (c) => new Date(c.target_date).getTime() > now,
    );
    const past = countdowns.filter(
        (c) => new Date(c.target_date).getTime() <= now,
    );
    const nearest = upcoming[0] ?? null;
    const rest = upcoming.slice(1);

    const handleAdd = async (name: string, date: string, emoji: string) => {
        await addCountdown(name, date, emoji);
        setAdding(false);
    };

    const handleUpdate = async (name: string, date: string, emoji: string) => {
        if (!editingCountdown) return;
        await updateCountdown(editingCountdown.id, name, date, emoji);
        setEditingCountdown(null);
    };

    return (
        <main className="max-w-3xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <CalendarClock size={22} className="text-indigo-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                            Countdowns
                        </h1>
                        <p className="text-sm text-stone-500 dark:text-zinc-500">
                            {upcoming.length} upcoming
                        </p>
                    </div>
                </div>
                {!adding && !editingCountdown && (
                    <button
                        onClick={() => {
                            setEditingCountdown(null);
                            setAdding(true);
                        }}
                        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                        <Plus size={16} />
                        Add countdown
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-40 bg-stone-100 dark:bg-zinc-800 rounded-2xl" />
                    <div className="h-20 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                </div>
            ) : (
                <div className="space-y-6">
                    {(adding || editingCountdown) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 p-6">
                            <AddForm
                                key={editingCountdown?.id ?? 'new-countdown'}
                                countdown={editingCountdown ?? undefined}
                                onSave={editingCountdown ? handleUpdate : handleAdd}
                                onCancel={() => {
                                    setAdding(false);
                                    setEditingCountdown(null);
                                }}
                            />
                        </div>
                    )}

                    {nearest ? (
                        <CountdownHero
                            countdown={nearest}
                            onEdit={(countdown) => {
                                setAdding(false);
                                setEditingCountdown(countdown);
                            }}
                            onDelete={(id) => {
                                void deleteCountdown(id);
                            }}
                        />
                    ) : (
                        !adding && (
                            <div className="flex flex-col items-center gap-3 py-16 text-stone-400 dark:text-zinc-600">
                                <CalendarClock
                                    size={40}
                                    className="opacity-40"
                                />
                                <p className="text-sm">
                                    No upcoming countdowns.
                                </p>
                                <button
                                    onClick={() => setAdding(true)}
                                    className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
                                >
                                    Add your first one →
                                </button>
                            </div>
                        )
                    )}

                    {rest.length > 0 && (
                        <CountdownList
                            countdowns={rest}
                            onEdit={(countdown) => {
                                setAdding(false);
                                setEditingCountdown(countdown);
                            }}
                            onDelete={(id) => {
                                void deleteCountdown(id);
                            }}
                        />
                    )}

                    {past.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-600 mb-3">
                                Past
                            </p>
                            <CountdownList
                                countdowns={past}
                                onEdit={(countdown) => {
                                    setAdding(false);
                                    setEditingCountdown(countdown);
                                }}
                                onDelete={(id) => {
                                    void deleteCountdown(id);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
