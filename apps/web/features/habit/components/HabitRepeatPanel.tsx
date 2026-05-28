'use client';

import type {
    Habit,
    HabitFrequency,
    RepeatConfig,
} from '@/features/habit/types/habit';
import { cn } from '@/lib/utils/utils';

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'custom', label: 'Custom' },
];
const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface HabitRepeatPanelProps {
    activeEvents: Habit[];
    repeatConfigs: Record<string, RepeatConfig | undefined>;
    setRepeatConfig: (
        id: string,
        config: Partial<RepeatConfig> & { frequency: HabitFrequency },
    ) => void;
}

export function HabitRepeatPanel({
    activeEvents,
    repeatConfigs,
    setRepeatConfig,
}: HabitRepeatPanelProps) {
    return (
        <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                Schedule
            </p>
            {activeEvents.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-zinc-500">
                    No active events.
                </p>
            ) : (
                activeEvents.map((habit) => {
                    const cfg = repeatConfigs[habit.id];
                    const freq = cfg?.frequency ?? 'daily';
                    return (
                        <div key={habit.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{habit.emoji}</span>
                                <span className="flex-1 text-xs font-medium text-stone-700 dark:text-zinc-200 truncate">
                                    {habit.name}
                                </span>
                            </div>
                            <div className="flex gap-1 flex-wrap ml-6">
                                {FREQ_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                            setRepeatConfig(habit.id, {
                                                frequency: opt.value,
                                            })
                                        }
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                            freq === opt.value
                                                ? 'bg-violet-500 text-white'
                                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700',
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {freq === 'custom' && (
                                <div className="flex gap-1 ml-6">
                                    {DOW_LABELS.map((d, idx) => {
                                        const selected =
                                            cfg?.daysOfWeek?.includes(idx) ??
                                            false;
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => {
                                                    const current =
                                                        cfg?.daysOfWeek ?? [];
                                                    const next = selected
                                                        ? current.filter(
                                                              (x) => x !== idx,
                                                          )
                                                        : [...current, idx];
                                                    setRepeatConfig(habit.id, {
                                                        frequency: 'custom',
                                                        daysOfWeek: next,
                                                    });
                                                }}
                                                className={cn(
                                                    'w-6 h-6 rounded text-[10px] font-medium transition-colors',
                                                    selected
                                                        ? 'bg-violet-500 text-white'
                                                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                                                )}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
