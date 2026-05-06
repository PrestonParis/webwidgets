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

export default function CountdownWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'countdown',
        'countdown',
    );
    const { countdowns, loading, addCountdown, deleteCountdown } =
        useCountdowns();
    const now = useCountdownTimer();
    const [adding, setAdding] = useState(false);

    const upcoming = countdowns.filter(
        (c) => new Date(c.target_date).getTime() > now,
    );
    const nearest = upcoming[0] ?? null;
    const rest = upcoming.slice(1);

    const handleAdd = async (name: string, date: string, emoji: string) => {
        await addCountdown(name, date, emoji);
        setAdding(false);
    };

    return (
        <WidgetShell
            icon={<CalendarClock size={16} />}
            title="Countdowns"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="countdown"
            widgetType="countdown"
        >
            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-20 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                </div>
            ) : (
                <>
                    {nearest ? (
                        <CountdownHero
                            countdown={nearest}
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
                        onDelete={(id) => {
                            void deleteCountdown(id);
                        }}
                    />

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
                            <Plus size={12} /> Add countdown
                        </button>
                    )}
                </>
            )}
        </WidgetShell>
    );
}
