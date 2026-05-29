'use client';

import { BarChart3 } from 'lucide-react';
import type { DeckStats, MemoryCardRecord } from '../hooks/useMemorization';

interface StudyStatisticsPanelProps {
    deckStats: DeckStats[];
    cards: MemoryCardRecord[];
}

export function StudyStatisticsPanel({
    deckStats,
    cards,
}: StudyStatisticsPanelProps) {
    const learning = cards.filter((card) => card.status === 'learning').length;
    const review = cards.filter((card) => card.status === 'review').length;
    const mastered = cards.filter((card) => card.status === 'mastered').length;
    const total = Math.max(cards.length, 1);

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Statistics
                </h2>
                <BarChart3 size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-3">
                <Progress
                    label="Learning"
                    value={learning}
                    total={total}
                    color="bg-blue-500"
                />
                <Progress
                    label="Review"
                    value={review}
                    total={total}
                    color="bg-amber-500"
                />
                <Progress
                    label="Mastered"
                    value={mastered}
                    total={total}
                    color="bg-emerald-500"
                />
                <p className="text-xs text-zinc-500">
                    {deckStats.length} decks tracked
                </p>
            </div>
        </section>
    );
}

function Progress({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    return (
        <div>
            <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-500">{label}</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {value}
                </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${Math.round((value / total) * 100)}%` }}
                />
            </div>
        </div>
    );
}
