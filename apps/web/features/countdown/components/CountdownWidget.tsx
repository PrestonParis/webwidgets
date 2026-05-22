'use client';

import { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useCountdowns } from '@/features/countdown/hooks/useCountdowns';
import { useCountdownTimer } from '@/features/countdown/hooks/useCountdownTimer';
import CountdownHero from '@/features/countdown/components/CountdownHero';
import CountdownList from '@/features/countdown/components/CountdownList';
import AddForm from '@/features/countdown/components/AddForm';
import { TimerMode } from '@/features/timekeeping/components/TimerMode';
import { cn } from '@/lib/utils/utils';
import type { Countdown } from '@/features/countdown/types/countdown';

type CountdownWidgetMode = 'standard' | 'events';

export default function CountdownWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'countdown',
        'countdown',
    );
    const { countdowns, loading, addCountdown, updateCountdown, deleteCountdown } =
        useCountdowns();
    const now = useCountdownTimer();
    const [adding, setAdding] = useState(false);
    const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(
        null,
    );
    const [mode, setMode] = useState<CountdownWidgetMode>('standard');

    const upcoming = countdowns.filter(
        (c) => new Date(c.target_date).getTime() > now,
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
        <WidgetShell
            icon={<CalendarClock size={16} />}
            title="Countdowns"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="countdown"
            widgetType="countdown"
            footerHref="/time?mode=countdown"
            footerLabel="View all →"
        >
            <div className="flex gap-0.5 mb-4 bg-stone-100 dark:bg-zinc-800/80 rounded-lg p-0.5">
                {(['standard', 'events'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                            'flex-1 text-[11px] font-medium py-1 rounded-md transition-all',
                            mode === m
                                ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                        )}
                    >
                        {m === 'standard' ? 'Timer' : 'Events'}
                    </button>
                ))}
            </div>

            {mode === 'standard' && <TimerMode />}

            {mode === 'events' &&
                (loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-20 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                    </div>
                ) : (
                    <>
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
                                <div className="flex flex-col items-center gap-2 py-4 text-stone-400 dark:text-zinc-600">
                                    <CalendarClock
                                        size={28}
                                        className="opacity-40"
                                    />
                                    <p className="text-xs">
                                        No upcoming countdowns.
                                    </p>
                                </div>
                            )
                        )}

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

                        {editingCountdown ? (
                            <AddForm
                                key={editingCountdown.id}
                                countdown={editingCountdown}
                                onSave={handleUpdate}
                                onCancel={() => setEditingCountdown(null)}
                            />
                        ) : adding ? (
                            <AddForm
                                onSave={handleAdd}
                                onCancel={() => setAdding(false)}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingCountdown(null);
                                    setAdding(true);
                                }}
                                className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                            >
                                <Plus size={12} /> Add countdown
                            </button>
                        )}
                    </>
                ))}
        </WidgetShell>
    );
}
