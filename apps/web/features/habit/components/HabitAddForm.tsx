import { useState } from 'react';
import { X } from 'lucide-react';
import { EMOJI_OPTIONS } from '@/features/habit/constants';
import type {
    HabitAddFormProps,
    HabitFrequency,
} from '@/features/habit/types/habit';

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'custom', label: 'Custom' },
];

export default function HabitAddForm({
    newName,
    newEmoji,
    onNameChange,
    onEmojiChange,
    onSubmit,
    onCancel,
    frequency = 'daily',
    onFrequencyChange,
}: HabitAddFormProps) {
    const [showPicker, setShowPicker] = useState(false);
    return (
        <form onSubmit={onSubmit} className="space-y-2">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setShowPicker((p) => !p)}
                    className="text-lg w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                    {newEmoji}
                </button>
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
                    Create
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-2 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 text-sm"
                >
                    <X size={14} />
                </button>
            </div>

            {showPicker && (
                <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((e) => (
                        <button
                            key={e}
                            type="button"
                            onClick={() => {
                                onEmojiChange(e);
                                setShowPicker(false);
                            }}
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
            )}

            {onFrequencyChange && (
                <div className="flex gap-1 flex-wrap">
                    {FREQUENCY_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onFrequencyChange(opt.value)}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                                frequency === opt.value
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </form>
    );
}
