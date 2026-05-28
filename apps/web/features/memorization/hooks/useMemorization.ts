'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    MemoryDifficulty,
    MemoryFilters,
    MemoryStatus,
} from '../types/memorization';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

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
    due_date: string;
    created_at: string;
}

export interface MemoryRoutineRecord {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    domain: string;
    minutes: number;
    enabled: boolean;
    created_at: string;
}

const defaultFilters: MemoryFilters = {
    query: '',
    domain: 'all',
    status: 'all',
};

export function useMemorization() {
    const [decks, setDecks] = useState<MemoryDeckRecord[]>([]);
    const [cards, setCards] = useState<MemoryCardRecord[]>([]);
    const [routines, setRoutines] = useState<MemoryRoutineRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<MemoryFilters>(defaultFilters);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [decksData, cardsData, routinesData] = await Promise.all([
                cachedJson<MemoryDeckRecord[]>('/api/memory/decks', {
                    ttlMs: 10_000,
                }),
                cachedJson<MemoryCardRecord[]>('/api/memory/cards', {
                    ttlMs: 10_000,
                }),
                cachedJson<MemoryRoutineRecord[]>('/api/memory/routines', {
                    ttlMs: 10_000,
                }),
            ]);
            setDecks(decksData);
            if (decksData.length > 0 && !selectedDeckId) {
                setSelectedDeckId(decksData[0]!.id);
            }
            setCards(cardsData);
            setRoutines(routinesData);
        } catch {
            setError('Failed to load memorization data');
        } finally {
            setLoading(false);
        }
    }, [selectedDeckId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchAll();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [fetchAll]);

    const createDeck = useCallback(
        async (data: {
            title: string;
            domain?: string;
            description?: string;
            source?: string;
        }) => {
            const res = await fetch('/api/memory/decks', {
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
        await fetch(`/api/memory/decks/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/memory/decks');
        clearCachedJson('/api/memory/cards');
        setDecks((prev) => prev.filter((d) => d.id !== id));
        setCards((prev) => prev.filter((c) => c.deck_id !== id));
    }, []);

    const createCard = useCallback(
        async (data: { deck_id: string; front: string; back: string }) => {
            const res = await fetch('/api/memory/cards', {
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
            const res = await fetch(`/api/memory/cards/${id}`, {
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
        await fetch(`/api/memory/cards/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/memory/cards');
        setCards((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const createRoutine = useCallback(
        async (data: {
            title: string;
            description?: string;
            domain?: string;
            minutes?: number;
        }) => {
            const res = await fetch('/api/memory/routines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create routine');
            clearCachedJson('/api/memory/routines');
            const routine = (await res.json()) as MemoryRoutineRecord;
            setRoutines((prev) => [...prev, routine]);
            return routine;
        },
        [],
    );

    const toggleRoutine = useCallback(
        async (id: string) => {
            const routine = routines.find((r) => r.id === id);
            if (!routine) return;
            const res = await fetch('/api/memory/routines', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: !routine.enabled }),
            });
            if (!res.ok) return;
            clearCachedJson('/api/memory/routines');
            const updated = (await res.json()) as MemoryRoutineRecord;
            setRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
        },
        [routines],
    );

    const selectedDeck = useMemo(
        () => decks.find((d) => d.id === selectedDeckId) ?? decks[0] ?? null,
        [decks, selectedDeckId],
    );

    const dueCards = useMemo(
        () => cards.filter((c) => new Date(c.due_date) <= new Date()),
        [cards],
    );

    const activeCard = dueCards[0] ?? null;

    const visibleDecks = useMemo(
        () =>
            decks.filter((deck) => {
                const query = filters.query.trim().toLowerCase();
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
                    (!query || haystack.includes(query)) &&
                    (filters.domain === 'all' ||
                        deck.domain === filters.domain) &&
                    (filters.status === 'all' || deck.status === filters.status)
                );
            }),
        [decks, filters],
    );

    const updateFilter = <Key extends keyof MemoryFilters>(
        key: Key,
        value: MemoryFilters[Key],
    ) => setFilters((current) => ({ ...current, [key]: value }));

    const resetFilters = () => setFilters(defaultFilters);

    const totalCards = cards.length;
    const masteredCards = cards.filter((c) => c.status === 'mastered').length;
    const retentionPct =
        totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    return {
        decks,
        cards,
        routines,
        loading,
        error,
        createDeck,
        deleteDeck,
        createCard,
        gradeCard,
        deleteCard,
        createRoutine,
        toggleRoutine,
        selectedDeckId,
        setSelectedDeckId,
        selectedDeck,
        dueCards,
        activeCard,
        filters,
        updateFilter,
        resetFilters,
        visibleDecks,
        // computed metrics
        totalDueCount: dueCards.length,
        retentionPct,
        deckCount: decks.length,
    };
}
