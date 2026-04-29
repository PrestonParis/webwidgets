'use client';

import { Smile } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useMoodLog } from '@/hooks/tracking/useMoodLog';

const MOODS: { value: number; emoji: string; label: string; color: string }[] =
    [
        {
            value: 1,
            emoji: '😣',
            label: 'Rough',
            color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
        },
        {
            value: 2,
            emoji: '😕',
            label: 'Meh',
            color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
        },
        {
            value: 3,
            emoji: '😐',
            label: 'Okay',
            color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
        },
        {
            value: 4,
            emoji: '🙂',
            label: 'Good',
            color: 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700',
        },
        {
            value: 5,
            emoji: '😄',
            label: 'Great',
            color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
        },
    ];

const DOT_COLORS: Record<number, string> = {
    1: 'bg-red-400',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-lime-400',
    5: 'bg-green-400',
};

export default function MoodWidget() {
    const { settings, updateSettings } = useWidgetSettings('mood', 'mood');
    const { entries, loading, logMood } = useMoodLog();

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find((e) => e.logged_date === today);

    // Last 7 days for history bar
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 86_400_000)
            .toISOString()
            .split('T')[0];
        const entry = entries.find((e) => e.logged_date === date);
        return { date, entry };
    });

    return (
        <WidgetShell
            icon={<Smile size={16} />}
            title="Mood"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-14 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                    <div className="h-6 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                </div>
            ) : (
                <>
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
                                onClick={() => logMood(m.value)}
                                title={m.label}
                                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
                                    todayEntry?.mood === m.value
                                        ? m.color + ' scale-105'
                                        : 'border-transparent hover:bg-stone-50 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <span className="text-xl">{m.emoji}</span>
                                <span className="text-[9px] text-stone-400 dark:text-zinc-600">
                                    {m.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* 7-day history */}
                    <div>
                        <p className="text-xs text-stone-400 dark:text-zinc-600 mb-2">
                            Last 7 days
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
                                                ? `${DOT_COLORS[entry.mood]} h-3`
                                                : 'bg-stone-100 dark:bg-zinc-800 h-3'
                                        }`}
                                        title={
                                            entry
                                                ? MOODS[entry.mood - 1]?.label
                                                : 'No entry'
                                        }
                                    />
                                    <span className="text-[8px] text-stone-300 dark:text-zinc-700">
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
                </>
            )}
        </WidgetShell>
    );
}
