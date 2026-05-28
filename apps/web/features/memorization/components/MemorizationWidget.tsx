'use client';

import { useEffect, useState } from 'react';
import { Brain, Repeat2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';

interface DeckRecord {
    id: string;
    title: string;
    domain: string;
    status: string;
}

interface CardRecord {
    id: string;
    due_date: string;
    status: string;
}

export default function MemorizationWidget({
    widgetId = 'memorization',
}: {
    widgetId?: string;
}) {
    const [dueCount, setDueCount] = useState<number | null>(null);
    const [deckCount, setDeckCount] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);

        void (async () => {
            try {
                const [decksResult, cardsResult] = await Promise.allSettled([
                    fetch('/api/memory/decks', { signal: controller.signal }),
                    fetch('/api/memory/cards?due=true', {
                        signal: controller.signal,
                    }),
                ]);

                const decks =
                    decksResult.status === 'fulfilled' && decksResult.value.ok
                        ? ((await decksResult.value.json()) as DeckRecord[])
                        : [];
                const cards =
                    cardsResult.status === 'fulfilled' && cardsResult.value.ok
                        ? ((await cardsResult.value.json()) as CardRecord[])
                        : [];

                if (!mounted) return;
                setDeckCount(decks.length);
                setDueCount(cards.length);
            } catch {
                if (!mounted) return;
                setDeckCount(0);
                setDueCount(0);
            } finally {
                window.clearTimeout(timeout);
            }
        })();

        return () => {
            mounted = false;
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    const badge =
        dueCount !== null && dueCount > 0 ? (
            <span className="text-[10px] font-bold text-amber-500">
                {dueCount} DUE
            </span>
        ) : dueCount === 0 ? (
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
                {dueCount === null || deckCount === null ? (
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
