'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { Filter, Plus, Search } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import type { MemoryFilters } from '../types/memorization';
import type { MemoryDeckRecord } from '../hooks/useMemorization';
import { DomainMark, statusStyles } from './MemorizationShared';

interface MemorizationDeckListProps {
    visibleDecks: MemoryDeckRecord[];
    selectedDeckId: string;
    setSelectedDeckId: (id: string) => void;
    filters: MemoryFilters;
    updateFilter: <K extends keyof MemoryFilters>(
        key: K,
        value: MemoryFilters[K],
    ) => void;
    createDeck: (data: {
        title: string;
        domain: string;
        description?: string;
    }) => Promise<void>;
    loading: boolean;
    showDeckForm: boolean;
    setShowDeckForm: Dispatch<SetStateAction<boolean>>;
}

export function MemorizationDeckList({
    visibleDecks,
    selectedDeckId,
    setSelectedDeckId,
    filters,
    updateFilter,
    createDeck,
    loading,
    showDeckForm,
    setShowDeckForm,
}: MemorizationDeckListProps) {
    const toast = useToastContext();
    const [deckTitle, setDeckTitle] = useState('');
    const [deckDomain, setDeckDomain] = useState('General');
    const [deckDesc, setDeckDesc] = useState('');
    const [deckSubmitting, setDeckSubmitting] = useState(false);

    async function handleCreateDeck(e: React.FormEvent) {
        e.preventDefault();
        if (!deckTitle.trim()) return;
        setDeckSubmitting(true);
        try {
            await createDeck({
                title: deckTitle.trim(),
                domain: deckDomain,
                ...(deckDesc.trim() ? { description: deckDesc.trim() } : {}),
            });
            setDeckTitle('');
            setDeckDomain('General');
            setDeckDesc('');
            setShowDeckForm(false);
            toast.success('Deck created.');
        } catch {
            toast.error('Failed to create deck.');
        } finally {
            setDeckSubmitting(false);
        }
    }

    return (
        <aside className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Search decks
                        <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                            <Search size={15} className="text-zinc-400" />
                            <input
                                value={filters.query}
                                onChange={(e) =>
                                    updateFilter('query', e.target.value)
                                }
                                placeholder="Highlights, workflows, language"
                                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                            />
                        </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={filters.domain}
                            onChange={(e) =>
                                updateFilter(
                                    'domain',
                                    e.target.value as typeof filters.domain,
                                )
                            }
                            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                            <option value="all">All domains</option>
                            <option value="Reading">Reading</option>
                            <option value="Knowledge">Knowledge</option>
                            <option value="Language">Language</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Workflows">Workflows</option>
                            <option value="General">General</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                updateFilter(
                                    'status',
                                    e.target.value as typeof filters.status,
                                )
                            }
                            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                            <option value="all">All statuses</option>
                            <option value="new">New</option>
                            <option value="learning">Learning</option>
                            <option value="review">Review</option>
                            <option value="mastered">Mastered</option>
                        </select>
                    </div>
                    <Button
                        variant="secondary"
                        icon={Filter}
                        onClick={() => updateFilter('status', 'review')}
                    >
                        Due review
                    </Button>
                </div>
            </div>

            <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        Decks
                    </h2>
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => setShowDeckForm(true)}
                    >
                        Add
                    </Button>
                </div>

                {showDeckForm && (
                    <form
                        onSubmit={(e) => {
                            void handleCreateDeck(e);
                        }}
                        className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 space-y-2"
                    >
                        <input
                            value={deckTitle}
                            onChange={(e) => setDeckTitle(e.target.value)}
                            placeholder="Deck title"
                            required
                            className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <select
                            value={deckDomain}
                            onChange={(e) => setDeckDomain(e.target.value)}
                            className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                            <option value="General">General</option>
                            <option value="Reading">Reading</option>
                            <option value="Knowledge">Knowledge</option>
                            <option value="Language">Language</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Workflows">Workflows</option>
                        </select>
                        <input
                            value={deckDesc}
                            onChange={(e) => setDeckDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={deckSubmitting}
                            >
                                {deckSubmitting ? 'Creating…' : 'Create'}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowDeckForm(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {loading && (
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                        Loading decks…
                    </div>
                )}

                {!loading && visibleDecks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            No decks yet
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Create a deck or import flashcards to start
                            reviewing.
                        </p>
                        <Button
                            className="mt-3"
                            size="sm"
                            icon={Plus}
                            onClick={() => setShowDeckForm(true)}
                        >
                            Create your first deck
                        </Button>
                    </div>
                )}

                {visibleDecks.map((deck) => (
                    <button
                        key={deck.id}
                        type="button"
                        onClick={() => setSelectedDeckId(deck.id)}
                        className={cn(
                            'w-full rounded-lg border p-4 text-left transition',
                            selectedDeckId === deck.id
                                ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                    {deck.title}
                                </h3>
                                <div className="mt-2">
                                    <DomainMark domain={deck.domain} />
                                </div>
                            </div>
                            <span
                                className={cn(
                                    'inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium',
                                    statusStyles[deck.status],
                                )}
                            >
                                {deck.status}
                            </span>
                        </div>
                        {deck.description && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                {deck.description}
                            </p>
                        )}
                    </button>
                ))}
            </section>
        </aside>
    );
}
