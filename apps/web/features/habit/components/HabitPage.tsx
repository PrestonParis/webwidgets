'use client';

import { Flame } from 'lucide-react';
import { useHabits } from '@/features/habit/hooks/useHabits';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitLoadingSkeleton from '@/features/habit/components/HabitLoadingSkeleton';
import HabitEmptyState from '@/features/habit/components/HabitEmptyState';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';
import HabitAddButton from '@/features/habit/components/HabitAddButton';

export function HabitPage() {
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

    const completedToday = habits.filter((h) => isCompletedToday(h.id)).length;

    return (
        <main className="max-w-2xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Flame size={22} className="text-orange-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                            Habits
                        </h1>
                        {habits.length > 0 && (
                            <p className="text-sm text-stone-500 dark:text-zinc-500">
                                {completedToday} / {habits.length} done today
                            </p>
                        )}
                    </div>
                </div>
                {!adding && <HabitAddButton onClick={openForm} />}
            </div>

            {loading ? (
                <HabitLoadingSkeleton />
            ) : (
                <div className="space-y-3">
                    {habits.length === 0 && !adding && <HabitEmptyState />}

                    <ul className="space-y-2">
                        {habits.map((habit) => (
                            <HabitListItem
                                key={habit.id}
                                habit={habit}
                                done={isCompletedToday(habit.id)}
                                streak={getHabitStreak(habit.id)}
                                days={getLast7Days(habit.id)}
                                onToggle={() => {
                                    void toggleCompletion(habit.id);
                                }}
                                onDelete={() => {
                                    void deleteHabit(habit.id);
                                }}
                            />
                        ))}
                    </ul>

                    {adding && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 p-4">
                            <HabitAddForm
                                newName={newName}
                                newEmoji={newEmoji}
                                onNameChange={setNewName}
                                onEmojiChange={setNewEmoji}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                            />
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
