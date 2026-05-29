'use client';

import { ArrowRight, Clock3 } from 'lucide-react';
import type {
    DeckStats,
    MemoryCardRecord,
    MemoryDeckRecord,
} from '../hooks/useMemorization';

interface ContinueStudyingPanelProps {
    decks: MemoryDeckRecord[];
    deckStats: DeckStats[];
    cards: MemoryCardRecord[];
    onSelectDeck: (deckId: string) => void;
    onStartStudy: (deckId: string) => void;
}

export function ContinueStudyingPanel({
    decks,
    deckStats,
    cards,
    onSelectDeck,
    onStartStudy,
}: ContinueStudyingPanelProps) {
    const statsByDeck = new Map(
        deckStats.map((stats) => [stats.deckId, stats]),
    );
    const nextDeck = decks
        .map((deck) => ({ deck, stats: statsByDeck.get(deck.id) }))
        .filter(
            (item) =>
                (item.stats?.dueCards ?? 0) > 0 ||
                cards.some(
                    (card) =>
                        card.deck_id === item.deck.id && card.status === 'new',
                ),
        )
        .sort((a, b) => (b.stats?.dueCards ?? 0) - (a.stats?.dueCards ?? 0))[0];

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Continue Studying
                </h2>
                <Clock3 size={17} className="text-blue-500" />
            </div>
            {nextDeck ? (
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => onSelectDeck(nextDeck.deck.id)}
                        className="block w-full rounded-md bg-zinc-50 p-3 text-left transition hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                    >
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {nextDeck.deck.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {nextDeck.stats?.dueCards ?? 0} due ·{' '}
                            {nextDeck.stats?.retention ?? 0}% retention
                        </p>
                    </button>
                    <button
                        type="button"
                        onClick={() => onStartStudy(nextDeck.deck.id)}
                        disabled={(nextDeck.stats?.dueCards ?? 0) === 0}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                        Start Study Session
                        <ArrowRight size={14} />
                    </button>
                </div>
            ) : (
                <div className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-950">
                    Create or import cards to start a study session.
                </div>
            )}
        </section>
    );
}
