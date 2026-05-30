'use client';

import { useState } from 'react';
import { X, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import { AddFormProps } from '@/features/countdown/types/countdown';

export default function AddForm({ countdown, onSave, onCancel }: AddFormProps) {
    const [name, setName] = useState(countdown?.name ?? '');
    const [date, setDate] = useState(
        () =>
            countdown?.target_date ??
            new Date(Date.now() + 7 * 86400000).toISOString(),
    );
    const [emoji, setEmoji] = useState(countdown?.emoji ?? '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onSave(name, date, emoji);
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
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    title="Pick an icon (optional)"
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-sky-400 transition-colors text-base"
                >
                    {emoji ? (
                        emoji
                    ) : (
                        <Smile
                            size={14}
                            className="text-stone-400 dark:text-zinc-500"
                        />
                    )}
                </button>
                {emoji && (
                    <button
                        type="button"
                        onClick={() => {
                            setEmoji('');
                            setShowEmojiPicker(false);
                        }}
                        title="Remove icon"
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-400 hover:text-red-500 hover:border-red-200 dark:hover:text-red-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Event name…"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 outline-none focus:border-sky-400 transition-colors"
                />
            </div>

            {showEmojiPicker && (
                <EmojiPicker
                    value={emoji}
                    onChange={(e) => {
                        setEmoji(e === emoji ? '' : e);
                        setShowEmojiPicker(false);
                    }}
                />
            )}

            <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full text-left text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 hover:border-sky-400 transition-colors"
            >
                📅 {selectedLabel}
            </button>
            {showDatePicker && (
                <div className="flex justify-center">
                    <DatePicker
                        value={date}
                        onChange={(iso) => {
                            setDate(iso);
                            setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
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
                    {countdown ? 'Update' : 'Add'}
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
