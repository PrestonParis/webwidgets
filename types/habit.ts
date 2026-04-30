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
}

export interface HabitAddFormProps {
    newName: string;
    newEmoji: string;
    onNameChange: (value: string) => void;
    onEmojiChange: (emoji: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

export interface HabitAddButtonProps {
    onClick: () => void;
}
