'use client';

import { useState } from 'react';
import {
    Brain,
    LibraryBig,
    Plus,
    Repeat2,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { cn } from '@/lib/utils/utils';
import { useMemorization } from '../hooks/useMemorization';
import { MemorizationDeckList } from './MemorizationDeckList';
import { MemorizationReviewCard } from './MemorizationReviewCard';
import { MemorizationRoutines } from './MemorizationRoutines';

const metricToneStyles = {
    emerald:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
};

export function MemorizationPage() {
    const {
        visibleDecks,
        selectedDeck,
        selectedDeckId,
        setSelectedDeckId,
        activeCard,
        dueCards,
        routines,
        toggleRoutine,
        filters,
        updateFilter,
        resetFilters,
        createDeck,
        createRoutine,
        gradeCard,
        totalDueCount,
        retentionPct,
        deckCount,
        loading,
    } = useMemorization();
    const [showDeckForm, setShowDeckForm] = useState(false);

    const metrics = [
        {
            id: 'due',
            label: 'Cards due',
            value: String(totalDueCount),
            detail: 'ready to review',
            icon: Repeat2,
            tone: 'amber' as const,
        },
        {
            id: 'retention',
            label: 'Retention',
            value: `${retentionPct}%`,
            detail: 'mastered / total',
            icon: Brain,
            tone: 'emerald' as const,
        },
        {
            id: 'decks',
            label: 'Active decks',
            value: String(deckCount),
            detail: 'in library',
            icon: LibraryBig,
            tone: 'blue' as const,
        },
        {
            id: 'streak',
            label: 'Review streak',
            value: '0',
            detail: 'days',
            icon: Sparkles,
            tone: 'rose' as const,
        },
    ];

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12"
        >
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <Brain size={13} />
                                Memorization
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <Repeat2 size={13} />
                                Spaced review system
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Turn notes, highlights, and workflows into durable
                            memory.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A spaced-repetition surface for reading highlights,
                            knowledge graph concepts, language prompts, workflow
                            drills, and fitness cues.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={RotateCcw}
                            onClick={resetFilters}
                        >
                            Reset
                        </Button>
                        <Button
                            icon={Plus}
                            onClick={() => setShowDeckForm(true)}
                        >
                            New deck
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <article
                                key={metric.id}
                                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-lg border',
                                            metricToneStyles[metric.tone],
                                        )}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <Sparkles
                                        size={15}
                                        className="text-zinc-400"
                                    />
                                </div>
                                <p className="mt-4 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                                    {metric.label}
                                </p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <strong className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                                        {metric.value}
                                    </strong>
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        {metric.detail}
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_340px]">
                    <MemorizationDeckList
                        visibleDecks={visibleDecks}
                        selectedDeckId={selectedDeckId}
                        setSelectedDeckId={setSelectedDeckId}
                        filters={filters}
                        updateFilter={updateFilter}
                        createDeck={createDeck}
                        loading={loading}
                        showDeckForm={showDeckForm}
                        setShowDeckForm={setShowDeckForm}
                    />
                    <MemorizationReviewCard
                        selectedDeck={selectedDeck}
                        activeCard={activeCard}
                        dueCards={dueCards}
                        gradeCard={gradeCard}
                        loading={loading}
                    />
                    <MemorizationRoutines
                        routines={routines}
                        toggleRoutine={toggleRoutine}
                        createRoutine={createRoutine}
                        loading={loading}
                    />
                </section>
            </section>
        </main>
    );
}
