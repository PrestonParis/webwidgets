'use client';

import { useMemo, useState } from 'react';
import { Brain, Flame, Layers3, Repeat2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
    useMemorization,
    type MemoryCardRecord,
} from '../hooks/useMemorization';
import { CardBrowserPanel } from './CardBrowserPanel';
import { ContinueStudyingPanel } from './ContinueStudyingPanel';
import { DeckLibraryPanel, type DeckSortMode } from './DeckLibraryPanel';
import { DueReviewPanel } from './DueReviewPanel';
import { ImportCardsPanel } from './ImportCardsPanel';
import { ReviewSessionPanel } from './ReviewSessionPanel';
import { StudySchedulePanel } from './StudySchedulePanel';
import { StudyStatisticsPanel } from './StudyStatisticsPanel';
import { WeakCardsPanel } from './WeakCardsPanel';

type View = 'dashboard' | 'review';

export function MemorizationPage() {
    return <MemorizationPageShell />;
}

export function MemorizationPageShell() {
    const mem = useMemorization();
    const [view, setView] = useState<View>('dashboard');
    const [reviewQueue, setReviewQueue] = useState<MemoryCardRecord[]>([]);
    const [reviewDeckTitle, setReviewDeckTitle] = useState('All decks');
    const [deckQuery, setDeckQuery] = useState('');
    const [deckSort, setDeckSort] = useState<DeckSortMode>('due');

    const selectedDeckCards = useMemo(
        () => mem.cards.filter((card) => card.deck_id === mem.selectedDeckId),
        [mem.cards, mem.selectedDeckId],
    );

    const selectedDeckStats = useMemo(
        () =>
            mem.deckStats.find((stats) => stats.deckId === mem.selectedDeckId),
        [mem.deckStats, mem.selectedDeckId],
    );

    function startStudy(deckId?: string, onlyNew = false) {
        const now = new Date();
        const deck = deckId
            ? mem.decks.find((item) => item.id === deckId)
            : null;
        const queue = mem.cards
            .filter((card) => !deckId || card.deck_id === deckId)
            .filter((card) =>
                onlyNew
                    ? card.status === 'new'
                    : new Date(card.due_date) <= now,
            );

        if (queue.length === 0) return;
        setReviewQueue(queue);
        setReviewDeckTitle(
            deck?.title ?? (onlyNew ? 'New cards' : 'All decks'),
        );
        setView('review');
    }

    if (view === 'review') {
        return (
            <main className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:px-6 lg:px-12">
                <ReviewSessionPanel
                    deckTitle={reviewDeckTitle}
                    queue={reviewQueue}
                    gradeCard={mem.gradeCard}
                    onExit={() => setView('dashboard')}
                />
            </main>
        );
    }

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:px-6 lg:px-12"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-5">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <Brain size={23} className="text-blue-600" />
                        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                            Memorization
                        </h1>
                    </div>
                    {!mem.loading && (
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            <SummaryMetric
                                icon={<Repeat2 size={14} />}
                                label="Due Today"
                                value={mem.totalDueCount}
                                active={mem.totalDueCount > 0}
                            />
                            <SummaryMetric
                                icon={<Brain size={14} />}
                                label="Retention"
                                value={`${mem.retentionPct}%`}
                            />
                            <SummaryMetric
                                icon={<Layers3 size={14} />}
                                label="Decks"
                                value={mem.deckCount}
                            />
                            <SummaryMetric
                                icon={<Flame size={14} />}
                                label="Streak"
                                value="0d"
                            />
                        </div>
                    )}
                </header>

                {mem.loading ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
                            <DueReviewPanel
                                dueCards={mem.dueCards}
                                deckStats={mem.deckStats}
                                decks={mem.decks}
                                onStartReview={() => startStudy()}
                            />
                            <ContinueStudyingPanel
                                decks={mem.decks}
                                deckStats={mem.deckStats}
                                cards={mem.cards}
                                onSelectDeck={mem.setSelectedDeckId}
                                onStartStudy={startStudy}
                            />
                            <DailyProgressPanel
                                reviewedToday={0}
                                dueToday={mem.totalDueCount}
                                retention={mem.retentionPct}
                            />
                        </section>

                        {mem.decks.length === 0 ? (
                            <ImportCardsPanel
                                decks={mem.decks}
                                createDeck={mem.createDeck}
                                importCards={mem.importCards}
                                onSelectDeck={mem.setSelectedDeckId}
                            />
                        ) : (
                            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                                <div className="flex min-w-0 flex-col gap-5">
                                    <DeckLibraryPanel
                                        decks={mem.decks}
                                        deckStats={mem.deckStats}
                                        selectedDeckId={mem.selectedDeckId}
                                        query={deckQuery}
                                        sort={deckSort}
                                        onQueryChange={setDeckQuery}
                                        onSortChange={setDeckSort}
                                        onSelectDeck={mem.setSelectedDeckId}
                                        onStartStudy={startStudy}
                                        createDeck={mem.createDeck}
                                    />
                                    <CardBrowserPanel
                                        deck={mem.selectedDeck}
                                        stats={selectedDeckStats}
                                        cards={selectedDeckCards}
                                        createCard={mem.createCard}
                                        deleteCard={mem.deleteCard}
                                        onStartDue={() =>
                                            startStudy(mem.selectedDeckId)
                                        }
                                        onStartNew={() =>
                                            startStudy(mem.selectedDeckId, true)
                                        }
                                    />
                                </div>
                                <div className="flex min-w-0 flex-col gap-5">
                                    <WeakCardsPanel
                                        cards={mem.weakCards}
                                        decks={mem.decks}
                                        onStartWeakCards={() => {
                                            if (mem.weakCards.length === 0)
                                                return;
                                            setReviewQueue(mem.weakCards);
                                            setReviewDeckTitle('Weak cards');
                                            setView('review');
                                        }}
                                    />
                                    <ImportCardsPanel
                                        decks={mem.decks}
                                        createDeck={mem.createDeck}
                                        importCards={mem.importCards}
                                        onSelectDeck={mem.setSelectedDeckId}
                                    />
                                    <StudySchedulePanel
                                        dueToday={mem.totalDueCount}
                                    />
                                    <StudyStatisticsPanel
                                        deckStats={mem.deckStats}
                                        cards={mem.cards}
                                    />
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

function SummaryMetric({
    icon,
    label,
    value,
    active = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    active?: boolean;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className={cn(active ? 'text-amber-600' : 'text-zinc-400')}>
                {icon}
            </span>
            <span
                className={cn(
                    'font-bold',
                    active
                        ? 'text-amber-600'
                        : 'text-zinc-950 dark:text-zinc-50',
                )}
            >
                {value}
            </span>
            <span className="text-xs text-zinc-500">{label}</span>
        </div>
    );
}

function DailyProgressPanel({
    reviewedToday,
    dueToday,
    retention,
}: {
    reviewedToday: number;
    dueToday: number;
    retention: number;
}) {
    const target = Math.max(dueToday, 20);
    const pct = Math.min(100, Math.round((reviewedToday / target) * 100));

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Daily Progress
                </h2>
                <Timer size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-3">
                <div>
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                        <span>{reviewedToday} reviewed</span>
                        <span>{target} target</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-950">
                        <p className="text-xs text-zinc-500">Due Today</p>
                        <p className="font-bold text-zinc-950 dark:text-zinc-50">
                            {dueToday}
                        </p>
                    </div>
                    <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-950">
                        <p className="text-xs text-zinc-500">Retention</p>
                        <p className="font-bold text-zinc-950 dark:text-zinc-50">
                            {retention}%
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
