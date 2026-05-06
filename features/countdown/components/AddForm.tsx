'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import { AddFormProps } from '@/features/countdown/types/countdown';

export default function AddForm({ onAdd, onCancel }: AddFormProps) {
    const [name, setName] = useState('');
    const [date, setDate] = useState(() =>
        new Date(Date.now() + 7 * 86400000).toISOString(),
    );
    const [emoji, setEmoji] = useState('🎯');
    const [showPicker, setShowPicker] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onAdd(name, date, emoji);
    };

    const selectedLabel = new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
            className="space-y-2 mt-1"
        >
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Event name…"
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 outline-none focus:border-sky-400 transition-colors"
            />
            <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-full text-left text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 hover:border-sky-400 transition-colors"
            >
                📅 {selectedLabel}
            </button>
            {showPicker && (
                <div className="flex justify-center">
                    <DatePicker
                        value={date}
                        onChange={(iso) => {
                            setDate(iso);
                            setShowPicker(false);
                        }}
                        onCancel={() => setShowPicker(false)}
                        allowFuture
                        showQuickActions={false}
                        saveLabel="Set date"
                        className="w-full"
                    />
                </div>
            )}
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!name.trim()}
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
