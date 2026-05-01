import { X } from 'lucide-react';
import { HabitListItemProps } from '@/features/habit/types/habit';

export default function HabitListItem({
    habit,
    done,
    streak,
    days,
    onToggle,
    onDelete,
}: HabitListItemProps) {
    return (
        <li className="group">
            <div className="flex items-center gap-2">
                {/* Checkbox */}
                <button
                    onClick={onToggle}
                    className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all text-sm ${
                        done
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-stone-300 dark:border-zinc-600 hover:border-violet-400'
                    }`}
                >
                    {done && <span className="text-white text-xs">✓</span>}
                </button>

                {/* Emoji + name */}
                <span className="text-base leading-none">{habit.emoji}</span>
                <span
                    className={`flex-1 text-sm truncate ${
                        done
                            ? 'line-through text-stone-400 dark:text-zinc-600'
                            : 'text-stone-700 dark:text-zinc-300'
                    }`}
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
                    onClick={onDelete}
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
}
