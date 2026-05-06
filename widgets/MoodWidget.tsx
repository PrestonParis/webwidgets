'use client';

import { Smile } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useMoodLog } from '@/features/mood/hooks/useMoodLog';
import { MOODS, DOT_COLORS } from '@/features/mood/constants';
import { useMoodHistory } from '@/features/mood/hooks/useMoodHistory';
import LoadingState from '@/features/ui/components/LoadingState';

export default function MoodWidget() {
    const { settings, updateSettings } = useWidgetSettings('mood', 'mood');
    const { entries, loading, logMood } = useMoodLog();
    const { last7, today } = useMoodHistory(entries);
    const todayEntry = entries.find((e) => e.logged_date === today);

    if (loading) return <LoadingState />;

    return (
        <WidgetShell
            icon={<Smile size={16} />}
            title="Mood"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="mood"
            widgetType="mood"
        >
            <div className="flex flex-col h-full">
                {/* Today's question */}
                <p className="text-sm text-stone-500 dark:text-zinc-400 mb-3">
                    {todayEntry
                        ? 'Today you felt:'
                        : 'How are you feeling today?'}
                </p>

                {/* Mood picker */}
                <div className="flex gap-2 mb-5">
                    {MOODS.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => {
                                void logMood(m.value);
                            }}
                            title={m.label}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
                                todayEntry?.score === m.value
                                    ? `${m.color} border-current scale-105`
                                    : 'border-transparent hover:bg-stone-50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <span className="text-xl">{m.emoji}</span>
                            <span className="text-[9px] text-stone-400 dark:text-zinc-600 font-medium">
                                {m.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* 7-day history */}
                <div className="mt-auto">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-600 mb-2">
                        Last 7 Days
                    </p>
                    <div className="flex gap-1.5 items-end">
                        {last7.map(({ date, entry }) => (
                            <div
                                key={date}
                                className="flex-1 flex flex-col items-center gap-1"
                            >
                                <div
                                    className={`w-full rounded-full transition-all ${
                                        entry
                                            ? `${DOT_COLORS[entry.score]} h-3`
                                            : 'bg-stone-100 dark:bg-zinc-800 h-3'
                                    }`}
                                    title={
                                        entry
                                            ? MOODS.find(
                                                  (m) =>
                                                      m.value === entry.score,
                                              )?.label
                                            : 'No entry'
                                    }
                                />
                                <span className="text-[8px] text-stone-300 dark:text-zinc-700 font-bold">
                                    {new Date(
                                        date + 'T12:00:00',
                                    ).toLocaleDateString('en-US', {
                                        weekday: 'narrow',
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </WidgetShell>
    );
}
