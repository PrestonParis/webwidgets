'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils/utils';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { formatInterval } from '../lib/sm2';
import type {
    MemoryCardRecord,
    MemoryDeckRecord,
    DeckStats,
} from '../hooks/useMemorization';

const STATUS_COLORS: Record<string, string> = {
    new: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
    learning: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
    review: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
    mastered:
        'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
};

interface DeckDetailProps {
    deck: MemoryDeckRecord;
    stats: DeckStats | undefined;
    cards: MemoryCardRecord[];
    onStudy: () => void;
    createCard: (data: {
        deck_id: string;
        front: string;
        back: string;
    }) => Promise<MemoryCardRecord>;
    deleteCard: (id: string) => Promise<void>;
    importCards: (
        deckId: string,
        rows: { front: string; back: string }[],
    ) => Promise<number>;
    deleteDeck: (id: string) => Promise<void>;
}

export function DeckDetail({
    deck,
    stats,
    cards,
    onStudy,
    createCard,
    deleteCard,
    importCards,
    deleteDeck,
}: DeckDetailProps) {
    const toast = useToastContext();
    const fileRef = useRef<HTMLInputElement>(null);
    const [showAddCard, setShowAddCard] = useState(false);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [deletingCard, setDeletingCard] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const deckCards = cards
        .filter((c) => c.deck_id === deck.id)
        .filter((c) => {
            const q = query.toLowerCase();
            return (
                !q ||
                c.front.toLowerCase().includes(q) ||
                c.back.toLowerCase().includes(q)
            );
        });

    async function handleAddCard(e: React.FormEvent) {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;
        setSubmitting(true);
        try {
            await createCard({
                deck_id: deck.id,
                front: front.trim(),
                back: back.trim(),
            });
            setFront('');
            setBack('');
            toast.success('Card added');
        } catch {
            toast.error('Failed to add card');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteCard(id: string) {
        setDeletingCard(id);
        try {
            await deleteCard(id);
        } catch {
            toast.error('Failed to delete card');
        } finally {
            setDeletingCard(null);
        }
    }

    function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        Papa.parse<string[]>(file, {
            complete: async (results) => {
                const rows = results.data
                    .filter((r) => r.length >= 2)
                    .map((r) => ({ front: r[0] ?? '', back: r[1] ?? '' }))
                    .filter((r) => r.front && r.back);
                if (rows.length === 0) {
                    toast.error('No valid rows found. Expected: front,back');
                    setImporting(false);
                    return;
                }
                try {
                    const count = await importCards(deck.id, rows);
                    toast.success(`Imported ${count} cards`);
                } catch {
                    toast.error('Import failed');
                } finally {
                    setImporting(false);
                    if (fileRef.current) fileRef.current.value = '';
                }
            },
            error: () => {
                toast.error('Failed to parse CSV');
                setImporting(false);
            },
        });
    }

    const due = stats?.dueCards ?? 0;
    const total = stats?.totalCards ?? 0;

    return (
        <div className="flex flex-col gap-5">
            {/* Deck header */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
                            {deck.title}
                        </h2>
                        {deck.description && (
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {deck.description}
                            </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                            <span>
                                <strong className="text-zinc-900 dark:text-zinc-100">
                                    {total}
                                </strong>{' '}
                                cards
                            </span>
                            <span>
                                <strong
                                    className={cn(
                                        due > 0
                                            ? 'text-amber-600'
                                            : 'text-zinc-900 dark:text-zinc-100',
                                    )}
                                >
                                    {due}
                                </strong>{' '}
                                due
                            </span>
                            <span>
                                <strong className="text-zinc-900 dark:text-zinc-100">
                                    {stats?.retention ?? 0}%
                                </strong>{' '}
                                retention
                            </span>
                            <span>
                                <strong className="text-zinc-900 dark:text-zinc-100">
                                    {stats?.masteredCards ?? 0}
                                </strong>{' '}
                                mastered
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => void deleteDeck(deck.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:border-rose-300 hover:text-rose-500 dark:border-zinc-700 transition-colors"
                        >
                            <Trash2 size={13} />
                        </button>
                        <button
                            onClick={onStudy}
                            disabled={due === 0}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {due === 0 ? 'All caught up' : `Study ${due} due`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add card / import */}
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Cards ({total})
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCsvFile}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={importing}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Upload size={11} />{' '}
                            {importing ? 'Importing…' : 'CSV'}
                        </button>
                        <button
                            onClick={() => setShowAddCard((v) => !v)}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
                        >
                            <Plus size={11} /> Add card
                        </button>
                    </div>
                </div>

                {showAddCard && (
                    <form
                        onSubmit={(e) => void handleAddCard(e)}
                        className="flex flex-col gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                    >
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder="Front (question or prompt)"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            placeholder="Back (answer)"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={
                                    submitting || !front.trim() || !back.trim()
                                }
                                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding…' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddCard(false)}
                                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                            CSV import: upload a file with{' '}
                            <code>front,back</code> columns (no header row
                            needed)
                        </p>
                    </form>
                )}

                {/* Card search */}
                {total > 5 && (
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search cards…"
                            className="w-full bg-transparent text-sm outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                        />
                    </div>
                )}

                {/* Card list */}
                <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {deckCards.length === 0 && (
                        <div className="py-10 text-center text-sm text-zinc-400">
                            {total === 0
                                ? 'No cards yet. Add one above or import CSV.'
                                : 'No cards match search'}
                        </div>
                    )}
                    {deckCards.map((card) => {
                        const isDue = new Date(card.due_date) <= new Date();
                        return (
                            <div
                                key={card.id}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                        {card.front}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                        {card.back}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                                STATUS_COLORS[card.status] ??
                                                    STATUS_COLORS.new,
                                            )}
                                        >
                                            {card.status}
                                        </span>
                                        <span className="text-[10px] text-zinc-400">
                                            {isDue ? (
                                                <span className="text-amber-500 font-semibold">
                                                    due
                                                </span>
                                            ) : (
                                                `next: ${formatInterval(card.interval_days)}`
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() =>
                                        void handleDeleteCard(card.id)
                                    }
                                    disabled={deletingCard === card.id}
                                    className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-rose-500 dark:text-zinc-600 transition-all"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
