'use client';

import { Brain, Repeat2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';

// Row shape returned by memoryDecksAdapter (flat MappedRow.data per deck)
interface DeckRow {
    id: string;
    title: string;
    domain: string;
    card_count: number;
    due_count: number;
    mastered_count: number;
}

export default function MemorizationWidget({
    widgetId = 'memorization',
}: {
    widgetId?: string;
}) {
    // Reads from memoryDecksAdapter via the manifest memory_decks source.
    // The adapter returns one row per deck with aggregated card and due counts.
    const { payload, loading } = useWidgetData(widgetId, 'memorization');

    const decks: DeckRow[] = (
        (payload?.sources['memory_decks']?.data as DeckRow[] | null) ?? []
    ).filter((d): d is DeckRow => d != null && typeof d.id === 'string');

    const deckCount = decks.length;
    const dueCount = decks.reduce((sum, d) => sum + (d.due_count ?? 0), 0);

    const badge =
        dueCount > 0 ? (
            <span className="text-[10px] font-bold text-amber-500">
                {dueCount} DUE
            </span>
        ) : deckCount > 0 ? (
            <span className="text-[10px] font-bold text-emerald-500">
                CLEAR
            </span>
        ) : undefined;

    return (
        <WidgetShell
            icon={<Brain size={16} />}
            title="Memorization"
            badge={badge}
            widgetId={widgetId}
            widgetType="memorization"
            footerHref="/memorization"
            footerLabel="Start review session ->"
        >
            <div className="space-y-2.5">
                {loading ? (
                    <p className="text-xs text-zinc-400">Loading…</p>
                ) : dueCount === 0 && deckCount === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Create a deck or import flashcards to start reviewing.
                    </p>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Repeat2
                                size={14}
                                className="shrink-0 text-amber-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {dueCount}{' '}
                                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                                    cards due
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Brain
                                size={14}
                                className="shrink-0 text-blue-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {deckCount}{' '}
                                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                                    active decks
                                </span>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </WidgetShell>
    );
}
