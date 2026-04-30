'use client';

import { Flame } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useHabits } from '@/hooks/tracking/useHabits';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitLoadingSkeleton from '@/features/habit//components/HabitLoadingSkeleton';
import HabitEmptyState from '@/features/habit//components/HabitEmptyState';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';
import HabitAddButton from '@/features/habit/components/HabitAddButton';

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

    return (
        <WidgetShell
            icon={<Flame size={16} />}
            title="Habits"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {loading ? (
                <HabitLoadingSkeleton />
            ) : (
                <>
                    {habits.length === 0 && !adding && <HabitEmptyState />}

                    <ul className="space-y-2 mb-3">
                        {habits.map((habit) => (
                            <HabitListItem
                                key={habit.id}
                                habit={habit}
                                done={isCompletedToday(habit.id)}
                                streak={getHabitStreak(habit.id)}
                                days={getLast7Days(habit.id)}
                                onToggle={() => toggleCompletion(habit.id)}
                                onDelete={() => deleteHabit(habit.id)}
                            />
                        ))}
                    </ul>

                    {adding ? (
                        <HabitAddForm
                            newName={newName}
                            newEmoji={newEmoji}
                            onNameChange={setNewName}
                            onEmojiChange={setNewEmoji}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                        />
                    ) : (
                        <HabitAddButton onClick={openForm} />
                    )}
                </>
            )}
        </WidgetShell>
    );
}
