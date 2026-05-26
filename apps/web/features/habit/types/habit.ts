export interface Habit {
    id: string;
    name: string;
    emoji: string;
    created_at: string;
}

export interface HabitCompletion {
    id: string;
    habit_id: string;
    completed_date: string;
}

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface RepeatConfig {
    frequency: HabitFrequency;
    daysOfWeek?: number[]; // 0=Sun … 6=Sat, used when frequency === 'custom'
}

export interface CalendarDay {
    date: string; // YYYY-MM-DD
    count: number;
    isToday: boolean;
    isCurrentMonth: boolean;
}

export interface UseHabitFormOptions {
    onAdd: (name: string, emoji: string) => Promise<void>;
}

export interface DayEntry {
    date: string;
    done: boolean;
}

export interface HabitListItemProps {
    habit: { id: string; name: string; emoji: string };
    done: boolean;
    streak: number;
    days: DayEntry[];
    onToggle: () => void;
    onDelete: () => void;
    lastCompletedLabel?: string;
    bestStreak?: number;
    frequencyLabel?: string;
    completionId?: string;
    completionTime?: string; // ISO datetime of today's completion, if done
    onEditTime?: (completionId: string, newIso: string) => void;
}

export interface HabitAddFormProps {
    newName: string;
    newEmoji: string;
    onNameChange: (value: string) => void;
    onEmojiChange: (emoji: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    frequency?: HabitFrequency;
    onFrequencyChange?: (f: HabitFrequency) => void;
}

export interface HabitAddButtonProps {
    onClick: () => void;
}
