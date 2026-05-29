'use client';

import { useState } from 'react';
import { Flame, Plus, X, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { useHabits } from '@/features/habit/hooks/useHabits';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';

const POPUP_KEY = 'habit_recovery_tip_v1';

function RecoveryTip({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 px-4 py-3 mb-3">
            <button
                onClick={onDismiss}
                className="absolute top-2.5 right-2.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                aria-label="Dismiss"
            >
                <X size={13} />
            </button>
            <div className="flex gap-2.5 items-start pr-4">
                <HeartHandshake
                    size={16}
                    className="text-amber-500 shrink-0 mt-0.5"
                />
                <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                        Trying to quit something serious?
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        The Recovery Tracker is built for that — streaks,
                        accountability, and full support.
                    </p>
                    <Link
                        href="/recovery"
                        className="inline-block mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline underline-offset-2 transition-colors"
                    >
                        Open Recovery →
                    </Link>
                </div>
            </div>
        </div>
    );
}

function TrackHabitEmpty({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-5">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Flame
                    size={22}
                    className="text-violet-400 dark:text-violet-500"
                />
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-stone-700 dark:text-zinc-200 tracking-tight">
                    Track Habit
                </p>
                <p className="text-xs text-stone-400 dark:text-zinc-600 mt-0.5">
                    Build streaks for anything you want to do daily
                </p>
            </div>
            <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
                <Plus size={13} />
                Add your first habit
            </button>
        </div>
    );
}

export function HabitSection() {
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

    const {
        adding,
        newName,
        newEmoji,
        setNewName,
        setNewEmoji,
        handleSubmit,
        handleCancel,
        openForm,
    } = useHabitForm({ onAdd: addHabit });

    const [showTip, setShowTip] = useState(
        () => typeof window !== 'undefined' && !localStorage.getItem(POPUP_KEY),
    );

    const dismissTip = () => {
        localStorage.setItem(POPUP_KEY, '1');
        setShowTip(false);
    };

    if (loading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-10 bg-stone-100 dark:bg-zinc-800 rounded-xl"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {showTip && habits.length === 0 && !adding && (
                <RecoveryTip onDismiss={dismissTip} />
            )}

            {habits.length === 0 && !adding ? (
                <TrackHabitEmpty onAdd={openForm} />
            ) : (
                <ul className="space-y-2 mb-2">
                    {habits.map((habit) => (
                        <HabitListItem
                            key={habit.id}
                            habit={habit}
                            done={isCompletedToday(habit.id)}
                            streak={getHabitStreak(habit.id)}
                            days={getLast7Days(habit.id)}
                            onToggle={() => void toggleCompletion(habit.id)}
                            onDelete={() => void deleteHabit(habit.id)}
                        />
                    ))}
                </ul>
            )}

            {adding ? (
                <HabitAddForm
                    newName={newName}
                    newEmoji={newEmoji}
                    onNameChange={setNewName}
                    onEmojiChange={setNewEmoji}
                    onSubmit={(e) => void handleSubmit(e)}
                    onCancel={handleCancel}
                />
            ) : (
                habits.length > 0 && (
                    <button
                        onClick={openForm}
                        className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                    >
                        <Plus size={12} /> Add habit
                    </button>
                )
            )}
        </div>
    );
}
