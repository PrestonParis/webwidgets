'use client';

import { Layers3, Timer } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { MemoryDifficulty } from '../types';
import type {
    MemoryCardRecord,
    MemoryDeckRecord,
} from '../hooks/useMemorization';
import { DomainMark, gradeStyles } from './MemorizationShared';

interface MemorizationReviewCardProps {
    selectedDeck: MemoryDeckRecord | undefined;
    activeCard: MemoryCardRecord | undefined;
    dueCards: MemoryCardRecord[];
    gradeCard: (id: string, grade: MemoryDifficulty) => Promise<void>;
    loading: boolean;
}

export function MemorizationReviewCard({
    selectedDeck,
    activeCard,
    dueCards,
    gradeCard,
    loading,
}: MemorizationReviewCardProps) {
    return (
        <section className="space-y-4">
            {selectedDeck ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                Selected deck
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                                {selectedDeck.title}
                            </h2>
                        </div>
                        <DomainMark domain={selectedDeck.domain} />
                    </div>
                    {selectedDeck.description && (
                        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            {selectedDeck.description}
                        </p>
                    )}
                    {selectedDeck.source && (
                        <p className="mt-2 text-xs text-zinc-500">
                            Source: {selectedDeck.source}
                        </p>
                    )}
                </div>
            ) : (
                !loading && (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select a deck to see details
                        </p>
                    </div>
                )
            )}

            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                            Review card
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {dueCards.length} cards due
                        </p>
                    </div>
                    <Layers3 size={18} className="text-zinc-400" />
                </div>
                {activeCard ? (
                    <>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
                            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                Prompt
                            </p>
                            <p className="mt-3 text-xl font-semibold leading-8 text-zinc-950 dark:text-zinc-50">
                                {activeCard.front}
                            </p>
                        </div>
                        <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                Answer
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                                {activeCard.back}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                                <Timer size={13} />
                                interval {activeCard.interval_days} days
                            </div>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-4">
                            {(
                                [
                                    'again',
                                    'hard',
                                    'medium',
                                    'easy',
                                ] as MemoryDifficulty[]
                            ).map((grade) => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() =>
                                        void gradeCard(activeCard.id, grade)
                                    }
                                    className={cn(
                                        'h-10 rounded-lg text-sm font-semibold capitalize transition',
                                        gradeStyles[grade],
                                    )}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-950">
                        {loading ? 'Loading cards…' : 'No review cards due.'}
                    </div>
                )}
            </section>
        </section>
    );
}
