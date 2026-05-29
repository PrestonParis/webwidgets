'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Pin, Play, Plus, Search } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils/utils';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { DeckStats, MemoryDeckRecord } from '../hooks/useMemorization';

export type DeckSortMode = 'due' | 'retention' | 'newest' | 'weakest';

interface DeckLibraryPanelProps {
    decks: MemoryDeckRecord[];
    deckStats: DeckStats[];
    selectedDeckId: string;
    query: string;
    sort: DeckSortMode;
    onQueryChange: (query: string) => void;
    onSortChange: (sort: DeckSortMode) => void;
    onSelectDeck: (deckId: string) => void;
    onStartStudy: (deckId: string) => void;
    createDeck: (data: {
        title: string;
        domain?: string;
        description?: string;
    }) => Promise<MemoryDeckRecord>;
}

export function DeckLibraryPanel({
    decks,
    deckStats,
    selectedDeckId,
    query,
    sort,
    onQueryChange,
    onSortChange,
    onSelectDeck,
    onStartStudy,
    createDeck,
}: DeckLibraryPanelProps) {
    const toast = useToastContext();
    const parentRef = useRef<HTMLDivElement>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('General');
    const [pinned, setPinned] = useState<Set<string>>(new Set());
    const statsByDeck = useMemo(
        () => new Map(deckStats.map((stats) => [stats.deckId, stats])),
        [deckStats],
    );

    const visibleDecks = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return decks
            .filter((deck) => {
                const text = [
                    deck.title,
                    deck.description ?? '',
                    deck.domain,
                    deck.source ?? '',
                ]
                    .join(' ')
                    .toLowerCase();
                return !needle || text.includes(needle);
            })
            .sort((a, b) => {
                if (pinned.has(a.id) !== pinned.has(b.id))
                    return pinned.has(a.id) ? -1 : 1;
                const aStats = statsByDeck.get(a.id);
                const bStats = statsByDeck.get(b.id);
                if (sort === 'retention')
                    return (aStats?.retention ?? 0) - (bStats?.retention ?? 0);
                if (sort === 'newest')
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    );
                if (sort === 'weakest')
                    return (
                        (aStats?.masteredCards ?? 0) -
                        (bStats?.masteredCards ?? 0)
                    );
                return (bStats?.dueCards ?? 0) - (aStats?.dueCards ?? 0);
            });
    }, [decks, pinned, query, sort, statsByDeck]);

    const virtualizer = useVirtualizer({
        count: visibleDecks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 92,
        overscan: 8,
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            await createDeck({ title: title.trim(), domain });
            setTitle('');
            setShowCreate(false);
            toast.success('Deck created');
        } catch {
            toast.error('Failed to create deck');
        }
    }

    function togglePin(deckId: string) {
        setPinned((current) => {
            const next = new Set(current);
            if (next.has(deckId)) next.delete(deckId);
            else next.add(deckId);
            return next;
        });
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        Decks
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <label className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 dark:border-zinc-700">
                            <Search size={14} className="text-zinc-400" />
                            <input
                                value={query}
                                onChange={(event) =>
                                    onQueryChange(event.target.value)
                                }
                                placeholder="Search decks"
                                className="w-36 bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                            />
                        </label>
                        <label className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-2 dark:border-zinc-700">
                            <ArrowDownUp size={14} className="text-zinc-400" />
                            <select
                                value={sort}
                                onChange={(event) =>
                                    onSortChange(
                                        event.target.value as DeckSortMode,
                                    )
                                }
                                className="bg-transparent text-sm outline-none dark:text-zinc-100"
                            >
                                <option value="due">Due</option>
                                <option value="retention">Retention</option>
                                <option value="newest">Newest</option>
                                <option value="weakest">Weakest</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowCreate((value) => !value)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Plus size={14} />
                            Create Deck
                        </button>
                    </div>
                </div>
                {showCreate && (
                    <form
                        onSubmit={(event) => void handleCreate(event)}
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]"
                    >
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Deck name"
                            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <select
                            value={domain}
                            onChange={(event) => setDomain(event.target.value)}
                            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                            <option>General</option>
                            <option>Reading</option>
                            <option>Knowledge</option>
                            <option>Language</option>
                        </select>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            Create
                        </button>
                    </form>
                )}
            </div>
            <div ref={parentRef} className="h-95 overflow-auto">
                {visibleDecks.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500">
                        No decks match your search.
                    </div>
                ) : (
                    <div
                        className="relative"
                        style={{ height: virtualizer.getTotalSize() }}
                    >
                        {virtualizer.getVirtualItems().map((item) => {
                            const deck = visibleDecks[item.index];
                            if (!deck) return null;
                            const stats = statsByDeck.get(deck.id);
                            const nestedDepth = Math.min(
                                deck.title.split('::').length - 1,
                                2,
                            );
                            return (
                                <div
                                    key={deck.id}
                                    className="absolute left-0 top-0 w-full px-4 py-1.5"
                                    style={{
                                        transform: `translateY(${item.start}px)`,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelectDeck(deck.id)}
                                        className={cn(
                                            'grid w-full grid-cols-[1fr_auto] gap-3 rounded-lg border p-3 text-left transition',
                                            selectedDeckId === deck.id
                                                ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                                        )}
                                    >
                                        <div
                                            className="min-w-0"
                                            style={{
                                                paddingLeft: nestedDepth * 16,
                                            }}
                                        >
                                            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                {deck.title.replaceAll(
                                                    '::',
                                                    ' / ',
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                {stats?.totalCards ?? 0} cards ·{' '}
                                                {stats?.dueCards ?? 0} due ·{' '}
                                                {stats?.retention ?? 0}%
                                                retention
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                title="Pin deck"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    togglePin(deck.id);
                                                }}
                                                className={cn(
                                                    'rounded-md p-1.5 text-zinc-400 hover:text-blue-600',
                                                    pinned.has(deck.id) &&
                                                        'text-blue-600',
                                                )}
                                            >
                                                <Pin size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    (stats?.dueCards ?? 0) === 0
                                                }
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onStartStudy(deck.id);
                                                }}
                                                className="rounded-md p-1.5 text-zinc-400 hover:text-blue-600 disabled:opacity-30"
                                            >
                                                <Play size={14} />
                                            </button>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
