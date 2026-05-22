'use client';

import { useState } from 'react';
import {
    Brain,
    Check,
    CircleAlert,
    Filter,
    Layers3,
    LibraryBig,
    Plus,
    Repeat2,
    RotateCcw,
    Search,
    Sparkles,
    Timer,
} from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { domainIcons } from '../data';
import { useMemorization } from '../hooks/useMemorization';
import type { MemoryDifficulty, MemoryStatus } from '../types';

const statusStyles: Record<MemoryStatus, string> = {
    new: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
    learning:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
    review: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    mastered:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
};

const gradeStyles: Record<MemoryDifficulty, string> = {
    again: 'bg-rose-600 text-white hover:bg-rose-700',
    hard: 'bg-amber-500 text-white hover:bg-amber-600',
    medium: 'bg-blue-600 text-white hover:bg-blue-700',
    easy: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function DomainMark({ domain }: { domain: string }) {
    const Icon = domainIcons[domain] ?? Brain;
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={14} />
            </span>
            {domain}
        </span>
    );
}

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
    const toast = useToastContext();

    const [showDeckForm, setShowDeckForm] = useState(false);
    const [deckTitle, setDeckTitle] = useState('');
    const [deckDomain, setDeckDomain] = useState('General');
    const [deckDesc, setDeckDesc] = useState('');
    const [deckSubmitting, setDeckSubmitting] = useState(false);

    const [showRoutineForm, setShowRoutineForm] = useState(false);
    const [routineTitle, setRoutineTitle] = useState('');
    const [routineDomain, setRoutineDomain] = useState('General');
    const [routineMinutes, setRoutineMinutes] = useState('10');
    const [routineSubmitting, setRoutineSubmitting] = useState(false);

    async function handleCreateDeck(e: React.FormEvent) {
        e.preventDefault();
        if (!deckTitle.trim()) return;
        setDeckSubmitting(true);
        try {
            await createDeck({ title: deckTitle.trim(), domain: deckDomain, ...(deckDesc.trim() ? { description: deckDesc.trim() } : {}) });
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

    async function handleCreateRoutine(e: React.FormEvent) {
        e.preventDefault();
        if (!routineTitle.trim()) return;
        setRoutineSubmitting(true);
        try {
            await createRoutine({ title: routineTitle.trim(), domain: routineDomain, minutes: Number(routineMinutes) || 10 });
            setRoutineTitle('');
            setRoutineDomain('General');
            setRoutineMinutes('10');
            setShowRoutineForm(false);
            toast.success('Routine created.');
        } catch {
            toast.error('Failed to create routine.');
        } finally {
            setRoutineSubmitting(false);
        }
    }

    const metrics = [
        { id: 'due', label: 'Cards due', value: String(totalDueCount), detail: 'ready to review', icon: Repeat2, tone: 'amber' as const },
        { id: 'retention', label: 'Retention', value: `${retentionPct}%`, detail: 'mastered / total', icon: Brain, tone: 'emerald' as const },
        { id: 'decks', label: 'Active decks', value: String(deckCount), detail: 'in library', icon: LibraryBig, tone: 'blue' as const },
        { id: 'streak', label: 'Review streak', value: '0', detail: 'days', icon: Sparkles, tone: 'rose' as const },
    ];

    const metricToneStyles = {
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
        blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
        amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
        rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
    };

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
                            Turn notes, highlights, and workflows into durable memory.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A spaced-repetition surface for reading highlights, knowledge graph concepts, language prompts, workflow drills, and fitness cues.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                            Reset
                        </Button>
                        <Button icon={Plus} onClick={() => setShowDeckForm(true)}>
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
                                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', metricToneStyles[metric.tone])}>
                                        <Icon size={18} />
                                    </span>
                                    <Sparkles size={15} className="text-zinc-400" />
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
                    <aside className="space-y-4">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Search decks
                                    <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                                        <Search size={15} className="text-zinc-400" />
                                        <input
                                            value={filters.query}
                                            onChange={(event) => updateFilter('query', event.target.value)}
                                            placeholder="Highlights, workflows, language"
                                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                                        />
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={filters.domain}
                                        onChange={(event) => updateFilter('domain', event.target.value as typeof filters.domain)}
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
                                        onChange={(event) => updateFilter('status', event.target.value as typeof filters.status)}
                                        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="new">New</option>
                                        <option value="learning">Learning</option>
                                        <option value="review">Review</option>
                                        <option value="mastered">Mastered</option>
                                    </select>
                                </div>
                                <Button variant="secondary" icon={Filter} onClick={() => updateFilter('status', 'review')}>
                                    Due review
                                </Button>
                            </div>
                        </div>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Memory decks
                                </h2>
                                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowDeckForm(true)}>
                                    Add
                                </Button>
                            </div>

                            {showDeckForm && (
                                <form onSubmit={handleCreateDeck} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
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
                                        <Button type="submit" size="sm" disabled={deckSubmitting}>
                                            {deckSubmitting ? 'Creating…' : 'Create'}
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" onClick={() => setShowDeckForm(false)}>
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
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No memory decks yet</p>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Create your first deck to start building durable memory.</p>
                                    <Button className="mt-3" size="sm" icon={Plus} onClick={() => setShowDeckForm(true)}>
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
                                        <span className={cn('inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium', statusStyles[deck.status])}>
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
                                    <p className="mt-2 text-xs text-zinc-500">Source: {selectedDeck.source}</p>
                                )}
                            </div>
                        ) : (
                            !loading && (
                                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Select a deck to see details</p>
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
                                        {(['again', 'hard', 'medium', 'easy'] as MemoryDifficulty[]).map((grade) => (
                                            <button
                                                key={grade}
                                                type="button"
                                                onClick={() => void gradeCard(activeCard.id, grade)}
                                                className={cn('h-10 rounded-lg text-sm font-semibold capitalize transition', gradeStyles[grade])}
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

                    <aside className="space-y-4">
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Repeat2 size={17} className="text-blue-500" />
                                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                        Review routines
                                    </h2>
                                </div>
                                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowRoutineForm(true)}>
                                    Add
                                </Button>
                            </div>

                            {showRoutineForm && (
                                <form onSubmit={handleCreateRoutine} className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 space-y-2">
                                    <input
                                        value={routineTitle}
                                        onChange={(e) => setRoutineTitle(e.target.value)}
                                        placeholder="Routine title"
                                        required
                                        className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={routineDomain}
                                            onChange={(e) => setRoutineDomain(e.target.value)}
                                            className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                        >
                                            <option value="General">General</option>
                                            <option value="Reading">Reading</option>
                                            <option value="Knowledge">Knowledge</option>
                                            <option value="Language">Language</option>
                                            <option value="Fitness">Fitness</option>
                                            <option value="Workflows">Workflows</option>
                                        </select>
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            value={routineMinutes}
                                            onChange={(e) => setRoutineMinutes(e.target.value)}
                                            placeholder="Minutes"
                                            className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={routineSubmitting}>
                                            {routineSubmitting ? 'Creating…' : 'Create'}
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" onClick={() => setShowRoutineForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {!loading && routines.length === 0 ? (
                                <div className="rounded-lg bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-950">
                                    No routines yet. Add one to schedule regular review sessions.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {routines.map((routine) => (
                                        <button
                                            key={routine.id}
                                            type="button"
                                            onClick={() => void toggleRoutine(routine.id)}
                                            className="rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <DomainMark domain={routine.domain} />
                                                    <h3 className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                        {routine.title}
                                                    </h3>
                                                </div>
                                                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', routine.enabled ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-950')}>
                                                    <Check size={13} />
                                                </span>
                                            </div>
                                            {routine.description && (
                                                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                                    {routine.description}
                                                </p>
                                            )}
                                            <p className="mt-3 text-xs font-medium text-zinc-500">
                                                {routine.minutes} min
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-4 flex items-center gap-2">
                                <CircleAlert size={17} className="text-amber-500" />
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Import suggestions
                                </h2>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Connect your Reading workspace or upload flashcard files to import cards automatically. Coming soon.
                            </p>
                        </section>
                    </aside>
                </section>
            </section>
        </main>
    );
}
