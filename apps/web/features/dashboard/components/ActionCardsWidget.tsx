'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import WidgetShell from '@/features/widgets/components/WidgetShell';

const STORAGE_KEY = 'dashboard_action_items';

interface ActionItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
}

function loadItems(): ActionItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ActionItem[]) : [];
    } catch {
        return [];
    }
}

function saveItems(items: ActionItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // storage unavailable
    }
}

export default function ActionCardsWidget({ widgetId = 'action-cards' }: { widgetId?: string }) {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Load from localStorage after mount
    useEffect(() => {
        setItems(loadItems());
    }, []);

    const persist = (next: ActionItem[]) => {
        setItems(next);
        saveItems(next);
    };

    const addItem = () => {
        const text = input.trim();
        if (!text) return;
        const next: ActionItem[] = [
            ...items,
            { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
        ];
        persist(next);
        setInput('');
        inputRef.current?.focus();
    };

    const toggleItem = (id: string) => {
        persist(items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    };

    const removeItem = (id: string) => {
        persist(items.filter((item) => item.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') addItem();
    };

    return (
        <WidgetShell
            icon={<CheckCircle2 size={16} />}
            title="Action Items"
            widgetId={widgetId}
            widgetType="action-cards"
            footerHref="/"
            footerLabel="Open dashboard ->"
        >
            <div className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-1">
                        Add things you want to stay on top of
                    </p>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5"
                        >
                            <button
                                type="button"
                                onClick={() => toggleItem(item.id)}
                                className={cn(
                                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                                    item.done
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-zinc-300 dark:border-zinc-600',
                                )}
                                aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
                            >
                                {item.done && <Check size={10} />}
                            </button>
                            <span className={cn('flex-1 text-xs text-zinc-800 dark:text-zinc-200 leading-5', item.done && 'line-through text-zinc-400 dark:text-zinc-500')}>
                                {item.text}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="mt-0.5 text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 transition"
                                aria-label="Remove"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}

                <div className="flex gap-1.5 pt-1">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add an action item…"
                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 transition"
                    />
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!input.trim()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 transition hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40"
                        aria-label="Add item"
                    >
                        <Plus size={13} />
                    </button>
                </div>
            </div>
        </WidgetShell>
    );
}
