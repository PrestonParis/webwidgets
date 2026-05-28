'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { MemoryDeckRecord, DeckStats } from '../hooks/useMemorization';

interface DeckSidebarProps {
    decks: MemoryDeckRecord[];
    deckStats: DeckStats[];
    selectedDeckId: string;
    onSelectDeck: (id: string) => void;
    onStartStudy: (deckId?: string) => void;
    createDeck: (data: {
        title: string;
        domain?: string;
        description?: string;
    }) => Promise<MemoryDeckRecord>;
    totalDueCount: number;
}

export function DeckSidebar({
    decks,
    deckStats,
    selectedDeckId,
    onSelectDeck,
    onStartStudy,
    createDeck,
    totalDueCount,
}: DeckSidebarProps) {
    const toast = useToastContext();
    const [query, setQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const statsMap = new Map(deckStats.map((s) => [s.deckId, s]));

    const filtered = decks.filter((d) => {
        const q = query.toLowerCase();
        return (
            !q ||
            d.title.toLowerCase().includes(q) ||
            (d.description ?? '').toLowerCase().includes(q)
        );
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            await createDeck({ title: title.trim() });
            setTitle('');
            setShowForm(false);
            toast.success('Deck created');
        } catch {
            toast.error('Failed to create deck');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <aside className="flex flex-col gap-3">
            {/* Study all due CTA */}
            {totalDueCount > 0 && (
                <button
                    onClick={() => onStartStudy()}
                    className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-left text-white hover:bg-blue-700 transition-colors"
                >
                    <div>
                        <p className="text-sm font-bold">Study Now</p>
                        <p className="text-xs opacity-80">
                            {totalDueCount} cards due
                        </p>
                    </div>
                    <span className="text-lg font-bold">{totalDueCount}</span>
                </button>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                <Search size={13} className="shrink-0 text-zinc-400" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search decks…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300"
                />
            </div>

            {/* Deck list */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Decks
                    </p>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                    >
                        <Plus size={12} /> New
                    </button>
                </div>

                {showForm && (
                    <form
                        onSubmit={(e) => void handleCreate(e)}
                        className="mb-2 flex gap-2"
                    >
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Deck name…"
                            autoFocus
                            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !title.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </form>
                )}

                {filtered.length === 0 && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="rounded-xl border border-dashed border-zinc-300 py-6 text-center text-xs font-medium text-zinc-400 hover:border-blue-400 hover:text-blue-500 dark:border-zinc-700 transition-colors"
                    >
                        + Create your first deck
                    </button>
                )}

                {filtered.map((deck) => {
                    const stats = statsMap.get(deck.id);
                    const due = stats?.dueCards ?? 0;
                    const selected = deck.id === selectedDeckId;
                    return (
                        <button
                            key={deck.id}
                            onClick={() => onSelectDeck(deck.id)}
                            className={cn(
                                'group flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors',
                                selected
                                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100'
                                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                            )}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {deck.title}
                                </p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {stats?.totalCards ?? 0} cards
                                    {stats ? ` · ${stats.retention}% ret.` : ''}
                                </p>
                            </div>
                            {due > 0 && (
                                <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                    {due}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
