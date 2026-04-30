import { Plus } from 'lucide-react';
import { HabitAddButtonProps } from '@/types/habit';

export default function HabitAddButton({ onClick }: HabitAddButtonProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
        >
            <Plus size={12} /> Add habit
        </button>
    );
}
