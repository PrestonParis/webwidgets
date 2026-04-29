'use client';

import { useState, FormEvent } from 'react';
import { Flame, Plus, X } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useHabits } from '@/hooks/tracking/useHabits';

const EMOJI_OPTIONS = [
    '✅',
    '📚',
    '🏃',
    '💧',
    '🧘',
    '🎸',
    '✍️',
    '💊',
    '🥗',
    '😴',
    '🧹',
    '💪',
];

export default function HabitWidget() {
    const { settings, updateSettings } = useWidgetSettings('habit', 'habit');
    const {
        habits,
        loading,
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        getHabitStreak,
        getLast7Days,
    } = useHabits();
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('✅');

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await addHabit(newName, newEmoji);
        setNewName('');
        setNewEmoji('✅');
        setAdding(false);
    };

    return (
        <WidgetShell
            icon={<Flame size={16} />}
            title="Habits"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 bg-stone-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {habits.length === 0 && !adding && (
                        <div className="flex flex-col items-center gap-2 py-6 text-stone-400 dark:text-zinc-600">
                            <Flame size={28} className="opacity-40" />
                            <p className="text-xs">
                                No habits yet. Add one to start tracking.
                            </p>
                        </div>
                    )}

                    {/* Habit list */}
                    <ul className="space-y-2 mb-3">
                        {habits.map((habit) => {
                            const done = isCompletedToday(habit.id);
                            const streak = getHabitStreak(habit.id);
                            const days = getLast7Days(habit.id);

                            return (
                                <li key={habit.id} className="group">
                                    <div className="flex items-center gap-2">
                                        {/* Checkbox */}
                                        <button
                                            onClick={() =>
                                                toggleCompletion(habit.id)
                                            }
                                            className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all text-sm ${
                                                done
                                                    ? 'bg-violet-500 border-violet-500'
                                                    : 'border-stone-300 dark:border-zinc-600 hover:border-violet-400'
                                            }`}
                                        >
                                            {done ? (
                                                <span className="text-white text-xs">
                                                    ✓
                                                </span>
                                            ) : null}
                                        </button>

                                        {/* Emoji + name */}
                                        <span className="text-base leading-none">
                                            {habit.emoji}
                                        </span>
                                        <span
                                            className={`flex-1 text-sm truncate ${done ? 'line-through text-stone-400 dark:text-zinc-600' : 'text-stone-700 dark:text-zinc-300'}`}
                                        >
                                            {habit.name}
                                        </span>

                                        {/* Streak */}
                                        {streak > 0 && (
                                            <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-0.5 shrink-0">
                                                🔥{streak}
                                            </span>
                                        )}

                                        {/* Delete */}
                                        <button
                                            onClick={() =>
                                                deleteHabit(habit.id)
                                            }
                                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all shrink-0"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>

                                    {/* 7-day dots */}
                                    <div className="flex gap-1 mt-1.5 ml-8">
                                        {days.map(({ date, done: d }) => (
                                            <div
                                                key={date}
                                                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                                    d
                                                        ? 'bg-violet-400 dark:bg-violet-500'
                                                        : 'bg-stone-100 dark:bg-zinc-800'
                                                }`}
                                                title={date}
                                            />
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Add form */}
                    {adding ? (
                        <form onSubmit={handleAdd} className="space-y-2">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {EMOJI_OPTIONS.map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setNewEmoji(e)}
                                        className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                            newEmoji === e
                                                ? 'bg-violet-100 dark:bg-violet-900/30'
                                                : 'hover:bg-stone-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Habit name…"
                                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 outline-none focus:border-violet-400 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newName.trim()}
                                    className="px-3 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm rounded-xl transition-colors"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdding(false)}
                                    className="px-2 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 text-sm"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setAdding(true)}
                            className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                        >
                            <Plus size={12} /> Add habit
                        </button>
                    )}
                </>
            )}
        </WidgetShell>
    );
}
