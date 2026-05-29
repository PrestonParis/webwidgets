'use client';

import { AlertTriangle, Play } from 'lucide-react';
import type {
    MemoryCardRecord,
    MemoryDeckRecord,
} from '../hooks/useMemorization';

interface WeakCardsPanelProps {
    cards: MemoryCardRecord[];
    decks: MemoryDeckRecord[];
    onStartWeakCards: () => void;
}

export function WeakCardsPanel({
    cards,
    decks,
    onStartWeakCards,
}: WeakCardsPanelProps) {
    const deckById = new Map(decks.map((deck) => [deck.id, deck.title]));

    return (
        <section className="rounded-lg border border-rose-100 bg-white p-4 dark:border-rose-950/50 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-500" />
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        Weak Cards
                    </h2>
                </div>
                <button
                    type="button"
                    disabled={cards.length === 0}
                    onClick={onStartWeakCards}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300"
                >
                    <Play size={12} />
                    Review
                </button>
            </div>
            {cards.length === 0 ? (
                <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-950">
                    No weak cards yet.
                </p>
            ) : (
                <div className="space-y-2">
                    {cards.slice(0, 6).map((card) => (
                        <div
                            key={card.id}
                            className="rounded-md bg-rose-50/70 p-3 dark:bg-rose-950/20"
                        >
                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {card.front}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                                {deckById.get(card.deck_id) ?? 'Deck'} ·{' '}
                                {card.interval_days}d interval
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
