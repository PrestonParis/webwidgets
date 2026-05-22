import { X } from 'lucide-react';
import { EMOJI_OPTIONS } from '@/features/habit/constants';
import { HabitAddFormProps } from '@/features/habit/types/habit';

export default function HabitAddForm({
    newName,
    newEmoji,
    onNameChange,
    onEmojiChange,
    onSubmit,
    onCancel,
}: HabitAddFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-2">
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5 mb-2">
                {EMOJI_OPTIONS.map((e) => (
                    <button
                        key={e}
                        type="button"
                        onClick={() => onEmojiChange(e)}
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

            {/* Name input + actions */}
            <div className="flex gap-2">
                <input
                    autoFocus
                    value={newName}
                    onChange={(e) => onNameChange(e.target.value)}
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
                    onClick={onCancel}
                    className="px-2 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 text-sm"
                >
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}
