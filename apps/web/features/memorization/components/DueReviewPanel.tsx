'use client';

import { Play, Repeat2 } from 'lucide-react';
import type {
    DeckStats,
    MemoryCardRecord,
    MemoryDeckRecord,
} from '../hooks/useMemorization';

interface DueReviewPanelProps {
    dueCards: MemoryCardRecord[];
    decks: MemoryDeckRecord[];
    deckStats: DeckStats[];
    onStartReview: () => void;
}

export function DueReviewPanel({
    dueCards,
    decks,
    deckStats,
    onStartReview,
}: DueReviewPanelProps) {
    const topDeck = deckStats
        .filter((stats) => stats.dueCards > 0)
        .sort((a, b) => b.dueCards - a.dueCards)[0];
    const deckTitle = decks.find((deck) => deck.id === topDeck?.deckId)?.title;

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        Due Review
                    </h2>
                    <p className="text-xs text-zinc-500">
                        Review-only due cards
                    </p>
                </div>
                <Repeat2 size={17} className="text-amber-500" />
            </div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
                        {dueCards.length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                        {dueCards.length === 0
                            ? 'No cards due right now'
                            : deckTitle
                              ? `${topDeck?.dueCards ?? 0} from ${deckTitle}`
                              : 'cards ready'}
                    </p>
                </div>
                <button
                    type="button"
                    disabled={dueCards.length === 0}
                    onClick={onStartReview}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Play size={15} />
                    Review
                </button>
            </div>
        </section>
    );
}
