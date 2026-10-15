'use client';

import { useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { previewInterval } from '../lib/sm2';
import { useStudySession } from '../hooks/useStudySession';
import type { MemoryDifficulty } from '../types/memorization';
import type { MemoryCardRecord } from '../hooks/useMemorization';

interface ReviewSessionProps {
    deckTitle: string;
    queue: MemoryCardRecord[];
    gradeCard: (id: string, grade: MemoryDifficulty) => Promise<void>;
    onExit: () => void;
}

const GRADE_BUTTONS: {
    grade: MemoryDifficulty;
    label: string;
    key: string;
    cls: string;
}[] = [
    {
        grade: 'again',
        label: 'Again',
        key: '1',
        cls: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    {
        grade: 'hard',
        label: 'Hard',
        key: '2',
        cls: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    {
        grade: 'good',
        label: 'Good',
        key: '3',
        cls: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
        grade: 'easy',
        label: 'Easy',
        key: '4',
        cls: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
];

export function ReviewSession({
    deckTitle,
    queue,
    gradeCard,
    onExit,
}: ReviewSessionProps) {
    const session = useStudySession(queue, gradeCard);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            )
                return;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!session.isFlipped) session.flip();
            }
            if (session.isFlipped && !session.grading) {
                if (e.key === '1') void session.grade('again');
                if (e.key === '2') void session.grade('hard');
                if (e.key === '3') void session.grade('good');
                if (e.key === '4') void session.grade('easy');
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [session]);

    const reviewed =
        session.stats.again +
        session.stats.hard +
        session.stats.good +
        session.stats.easy;

    if (session.isComplete) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-16">
                <CheckCircle2 size={56} className="text-emerald-500" />
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                        Session complete
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        You reviewed {reviewed} cards from {deckTitle}
                    </p>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                    {GRADE_BUTTONS.map(({ grade, label, cls }) => (
                        <div
                            key={grade}
                            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div
                                className={cn(
                                    'mx-auto mb-1 h-2 w-8 rounded-full',
                                    cls.split(' ')[0],
                                )}
                            />
                            <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                                {session.stats[grade]}
                            </p>
                            <p className="text-xs text-zinc-500">{label}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onExit}
                    className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                    Back to library
                </button>
            </div>
        );
    }

    const card = session.currentCard!;
    const remaining = session.queueLength - reviewed;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onExit}
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <ArrowLeft size={15} /> Back
                </button>
                <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {deckTitle}
                    </p>
                </div>
                <p className="shrink-0 text-xs text-zinc-500">
                    {remaining} left
                </p>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${session.progress * 100}%` }}
                />
            </div>

            {/* Card face */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-48 flex items-center justify-center">
                <p className="text-center text-2xl font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
                    {card.front}
                </p>
            </div>

            {/* Answer reveal / Grade buttons */}
            {!session.isFlipped ? (
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={session.flip}
                        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
                    >
                        Show Answer
                        <span className="ml-2 text-xs font-normal opacity-50">
                            Space
                        </span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Answer */}
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                            Answer
                        </p>
                        <p className="text-lg text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                            {card.back}
                        </p>
                    </div>

                    {/* Grade buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {GRADE_BUTTONS.map(({ grade, label, key, cls }) => (
                            <button
                                key={grade}
                                onClick={() => void session.grade(grade)}
                                disabled={session.grading}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50',
                                    cls,
                                )}
                            >
                                <span>{label}</span>
                                <span className="text-[10px] font-normal opacity-70">
                                    {previewInterval(card, grade)} · {key}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-xs text-zinc-400">
                        Press 1–4 to grade
                    </p>
                </div>
            )}
        </div>
    );
}
