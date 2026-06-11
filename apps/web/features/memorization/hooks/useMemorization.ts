'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    MemoryDifficulty,
    MemoryFilters,
    MemoryStatus,
} from '../types/memorization';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export interface MemoryRoutineRecord {
    id: string;
    title: string;
    domain: string;
    minutes: number;
    enabled: boolean;
    description?: string;
}

export interface MemoryDeckRecord {
    id: string;
    user_id: string;
    title: string;
    domain: string;
    description: string | null;
    source: string | null;
    status: MemoryStatus;
    created_at: string;
}

export interface MemoryCardRecord {
    id: string;
    user_id: string;
    deck_id: string;
    front: string;
    back: string;
    status: MemoryStatus;
    interval_days: number;
    ease: number;
    repetitions: number;
    due_date: string;
    created_at: string;
}

export interface DeckStats {
    deckId: string;
    totalCards: number;
    dueCards: number;
    masteredCards: number;
    retention: number;
}

const defaultFilters: MemoryFilters = {
    query: '',
    domain: 'all',
    status: 'all',
};
const now = () => new Date();

export function useMemorization() {
    const [decks, setDecks] = useState<MemoryDeckRecord[]>([]);
    const [cards, setCards] = useState<MemoryCardRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<MemoryFilters>(defaultFilters);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [decksData, cardsData] = await Promise.all([
                cachedJson<MemoryDeckRecord[]>('/api/memory/decks', {
                    ttlMs: 10_000,
                }),
                cachedJson<MemoryCardRecord[]>('/api/memory/cards', {
                    ttlMs: 10_000,
                }),
            ]);
            setDecks(decksData);
            setCards(cardsData);
        } catch {
            setError('Failed to load memorization data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => void fetchAll(), 0);
        return () => window.clearTimeout(id);
    }, [fetchAll]);

    const createDeck = useCallback(
        async (data: {
            title: string;
            domain?: string;
            description?: string;
            source?: string;
        }) => {
            const res = await apiRouteFetch('/api/memory/decks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create deck');
            clearCachedJson('/api/memory/decks');
            const deck = (await res.json()) as MemoryDeckRecord;
            setDecks((prev) => [deck, ...prev]);
            setSelectedDeckId(deck.id);
            return deck;
        },
        [],
    );

    const deleteDeck = useCallback(async (id: string) => {
        await apiRouteFetch(`/api/memory/decks/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/memory/decks');
        clearCachedJson('/api/memory/cards');
        setDecks((prev) => prev.filter((d) => d.id !== id));
        setCards((prev) => prev.filter((c) => c.deck_id !== id));
        setSelectedDeckId((prev) => (prev === id ? '' : prev));
    }, []);

    const createCard = useCallback(
        async (data: { deck_id: string; front: string; back: string }) => {
            const res = await apiRouteFetch('/api/memory/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create card');
            clearCachedJson('/api/memory/cards');
            const card = (await res.json()) as MemoryCardRecord;
            setCards((prev) => [card, ...prev]);
            return card;
        },
        [],
    );

    const gradeCard = useCallback(
        async (id: string, difficulty: MemoryDifficulty) => {
            const res = await apiRouteFetch(`/api/memory/cards/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade: difficulty }),
            });
            if (!res.ok) return;
            clearCachedJson('/api/memory/cards');
            const updated = (await res.json()) as MemoryCardRecord;
            setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
        },
        [],
    );

    const deleteCard = useCallback(async (id: string) => {
        await apiRouteFetch(`/api/memory/cards/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/memory/cards');
        setCards((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const importCards = useCallback(
        async (deckId: string, rows: { front: string; back: string }[]) => {
            const created: MemoryCardRecord[] = [];
            for (const row of rows) {
                if (!row.front.trim() || !row.back.trim()) continue;
                const res = await apiRouteFetch('/api/memory/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deck_id: deckId,
                        front: row.front.trim(),
                        back: row.back.trim(),
                    }),
                });
                if (res.ok)
                    created.push((await res.json()) as MemoryCardRecord);
            }
            clearCachedJson('/api/memory/cards');
            setCards((prev) => [...created, ...prev]);
            return created.length;
        },
        [],
    );

    // Derived data
    const dueCards = useMemo(
        () => cards.filter((c) => new Date(c.due_date) <= now()),
        [cards],
    );

    const deckStats = useMemo((): DeckStats[] => {
        const n = now();
        const stats = new Map<
            string,
            { totalCards: number; dueCards: number; masteredCards: number }
        >();
        for (const card of cards) {
            const current = stats.get(card.deck_id) ?? {
                totalCards: 0,
                dueCards: 0,
                masteredCards: 0,
            };
            current.totalCards += 1;
            if (new Date(card.due_date) <= n) current.dueCards += 1;
            if (card.status === 'mastered') current.masteredCards += 1;
            stats.set(card.deck_id, current);
        }

        return decks.map((deck) => {
            const deckStats = stats.get(deck.id) ?? {
                totalCards: 0,
                dueCards: 0,
                masteredCards: 0,
            };
            return {
                deckId: deck.id,
                ...deckStats,
                retention:
                    deckStats.totalCards > 0
                        ? Math.round(
                              (deckStats.masteredCards / deckStats.totalCards) *
                                  100,
                          )
                        : 0,
            };
        });
    }, [decks, cards]);

    const weakCards = useMemo(
        () =>
            cards.filter(
                (c) =>
                    c.status === 'learning' ||
                    (c.repetitions > 0 && c.interval_days <= 2),
            ),
        [cards],
    );

    const visibleDecks = useMemo(
        () =>
            decks.filter((deck) => {
                const q = filters.query.trim().toLowerCase();
                const haystack = [
                    deck.title,
                    deck.description ?? '',
                    deck.domain,
                    deck.source ?? '',
                    deck.status,
                ]
                    .join(' ')
                    .toLowerCase();
                return (
                    (!q || haystack.includes(q)) &&
                    (filters.domain === 'all' ||
                        deck.domain === filters.domain) &&
                    (filters.status === 'all' || deck.status === filters.status)
                );
            }),
        [decks, filters],
    );

    const selectedDeck = useMemo(
        () => decks.find((d) => d.id === selectedDeckId) ?? null,
        [decks, selectedDeckId],
    );

    const totalCards = cards.length;
    const masteredCards = cards.filter((c) => c.status === 'mastered').length;
    const retentionPct =
        totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    const updateFilter = <K extends keyof MemoryFilters>(
        key: K,
        value: MemoryFilters[K],
    ) => setFilters((f) => ({ ...f, [key]: value }));
    const resetFilters = () => setFilters(defaultFilters);

    return {
        decks,
        cards,
        loading,
        error,
        createDeck,
        deleteDeck,
        createCard,
        gradeCard,
        deleteCard,
        importCards,
        selectedDeckId,
        setSelectedDeckId,
        selectedDeck,
        dueCards,
        weakCards,
        deckStats,
        filters,
        updateFilter,
        resetFilters,
        visibleDecks,
        totalDueCount: dueCards.length,
        retentionPct,
        deckCount: decks.length,
        refetch: fetchAll,
    };
}
