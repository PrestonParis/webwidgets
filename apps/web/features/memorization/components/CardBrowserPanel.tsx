'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils/utils';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { formatInterval } from '../lib/sm2';
import type {
    DeckStats,
    MemoryCardRecord,
    MemoryDeckRecord,
} from '../hooks/useMemorization';

interface CardBrowserPanelProps {
    deck: MemoryDeckRecord | null;
    stats: DeckStats | undefined;
    cards: MemoryCardRecord[];
    createCard: (data: {
        deck_id: string;
        front: string;
        back: string;
    }) => Promise<MemoryCardRecord>;
    deleteCard: (cardId: string) => Promise<void>;
    onStartDue: () => void;
    onStartNew: () => void;
}

export function CardBrowserPanel({
    deck,
    stats,
    cards,
    createCard,
    deleteCard,
    onStartDue,
    onStartNew,
}: CardBrowserPanelProps) {
    const toast = useToastContext();
    const parentRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');

    const filteredCards = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return cards.filter(
            (card) =>
                !needle ||
                `${card.front} ${card.back} ${card.status}`
                    .toLowerCase()
                    .includes(needle),
        );
    }, [cards, query]);

    const virtualizer = useVirtualizer({
        count: filteredCards.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 74,
        overscan: 10,
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!deck || !front.trim() || !back.trim()) return;
        try {
            await createCard({
                deck_id: deck.id,
                front: front.trim(),
                back: back.trim(),
            });
            setFront('');
            setBack('');
            toast.success('Card added');
        } catch {
            toast.error('Failed to add card');
        }
    }

    if (!deck) {
        return (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                Select a deck to browse cards, practice new cards, or add manual
                cards.
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {deck.title}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                            {stats?.totalCards ?? 0} cards ·{' '}
                            {stats?.dueCards ?? 0} due ·{' '}
                            {stats?.masteredCards ?? 0} mastered
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onStartDue}
                            disabled={(stats?.dueCards ?? 0) === 0}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                            Review Due
                        </button>
                        <button
                            type="button"
                            onClick={onStartNew}
                            disabled={
                                !cards.some((card) => card.status === 'new')
                            }
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                        >
                            Study New
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm((value) => !value)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Plus size={13} />
                            Add Card
                        </button>
                    </div>
                </div>
                {showForm && (
                    <form
                        onSubmit={(event) => void handleCreate(event)}
                        className="mt-3 grid gap-2"
                    >
                        <textarea
                            value={front}
                            onChange={(event) => setFront(event.target.value)}
                            placeholder="Front side"
                            rows={2}
                            className="resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <textarea
                            value={back}
                            onChange={(event) => setBack(event.target.value)}
                            placeholder="Back side"
                            rows={2}
                            className="resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <button
                            type="submit"
                            disabled={!front.trim() || !back.trim()}
                            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                            Save Card
                        </button>
                    </form>
                )}
                <label className="mt-3 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 dark:border-zinc-700">
                    <Search size={14} className="text-zinc-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search cards, tags, answers"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                    />
                </label>
            </div>
            <div ref={parentRef} className="h-[340px] overflow-auto">
                {filteredCards.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500">
                        {cards.length === 0
                            ? 'Add a manual card or import cards into this deck.'
                            : 'No cards match your search.'}
                    </div>
                ) : (
                    <div
                        className="relative"
                        style={{ height: virtualizer.getTotalSize() }}
                    >
                        {virtualizer.getVirtualItems().map((item) => {
                            const card = filteredCards[item.index];
                            const due = new Date(card.due_date) <= new Date();
                            return (
                                <div
                                    key={card.id}
                                    className="absolute left-0 top-0 w-full px-4 py-1"
                                    style={{
                                        transform: `translateY(${item.start}px)`,
                                    }}
                                >
                                    <div className="group grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                                {card.front}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                {card.back}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 font-semibold',
                                                        due
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                                                    )}
                                                >
                                                    {due
                                                        ? 'due'
                                                        : `next ${formatInterval(card.interval_days)}`}
                                                </span>
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-zinc-800">
                                                    {card.status}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void deleteCard(card.id)
                                            }
                                            className="self-start rounded-md p-1.5 text-zinc-300 transition hover:text-rose-600"
                                            title="Delete card"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
