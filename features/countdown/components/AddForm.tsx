import { useState } from 'react';
import { X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { AddFormProps } from '@/types/countdown';

export default function AddForm({ onAdd, onCancel }: AddFormProps) {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [emoji, setEmoji] = useState('🎯');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim() || !date) return;
        await onAdd(name, new Date(date).toISOString(), emoji);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mt-1">
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Event name…"
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 outline-none focus:border-sky-400 transition-colors"
            />
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-sky-400 transition-colors"
            />
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!name.trim() || !date}
                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    Add
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 text-sm"
                >
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}
