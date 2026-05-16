'use client';

import { Flame } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useHabits } from '@/features/habit/hooks/useHabits';
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
            widgetId="habits"
            widgetType="habits"
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
                                onToggle={() => {
                                    void toggleCompletion(habit.id);
                                }}
                                onDelete={() => {
                                    void deleteHabit(habit.id);
                                }}
                            />
                        ))}
                    </ul>

                    {adding ? (
                        <HabitAddForm
                            newName={newName}
                            newEmoji={newEmoji}
                            onNameChange={setNewName}
                            onEmojiChange={setNewEmoji}
                            onSubmit={(e) => {
                                void handleSubmit(e);
                            }}
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
