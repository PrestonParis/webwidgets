'use client';

import { useMemo, useRef, useState } from 'react';
import { FileText, Sparkles, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { MemoryDeckRecord } from '../hooks/useMemorization';

interface ImportCardsPanelProps {
    decks: MemoryDeckRecord[];
    createDeck: (data: {
        title: string;
        domain?: string;
        description?: string;
        source?: string;
    }) => Promise<MemoryDeckRecord>;
    importCards: (
        deckId: string,
        rows: { front: string; back: string }[],
    ) => Promise<number>;
    onSelectDeck: (deckId: string) => void;
}

export function ImportCardsPanel({
    decks,
    createDeck,
    importCards,
    onSelectDeck,
}: ImportCardsPanelProps) {
    const toast = useToastContext();
    const fileRef = useRef<HTMLInputElement>(null);
    const [deckId, setDeckId] = useState(decks[0]?.id ?? '');
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const activeDeckId = deckId || decks[0]?.id || '';

    const deckOptions = useMemo(
        () => decks.map((deck) => ({ id: deck.id, title: deck.title })),
        [decks],
    );

    async function ensureDeck(source: string) {
        if (activeDeckId) return activeDeckId;
        const title = newDeckTitle.trim() || source;
        const deck = await createDeck({ title, source });
        onSelectDeck(deck.id);
        setDeckId(deck.id);
        return deck.id;
    }

    async function saveRows(
        rows: { front: string; back: string }[],
        source: string,
    ) {
        const cleanRows = rows
            .map((row) => ({ front: row.front.trim(), back: row.back.trim() }))
            .filter((row) => row.front && row.back);
        if (cleanRows.length === 0) {
            toast.error('No cards found');
            return;
        }
        setBusy(true);
        try {
            const targetDeckId = await ensureDeck(source);
            const count = await importCards(targetDeckId, cleanRows);
            toast.success(`Imported ${count} cards`);
        } catch {
            toast.error('Import failed');
        } finally {
            setBusy(false);
        }
    }

    function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const raw = String(reader.result ?? '');
            if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                void saveRows(parseMarkdownCards(raw), 'Markdown notes');
                return;
            }
            Papa.parse<string[]>(raw, {
                complete: (result) => {
                    const rows = result.data
                        .filter((row) => row.length >= 2)
                        .map((row) => ({
                            front: row[0] ?? '',
                            back: row.slice(1).join(' '),
                        }));
                    void saveRows(
                        rows,
                        file.name.endsWith('.txt')
                            ? 'Anki export'
                            : 'CSV flashcards',
                    );
                },
            });
        };
        reader.readAsText(file);
        if (fileRef.current) fileRef.current.value = '';
    }

    async function generateFromText() {
        if (!text.trim()) return;
        setBusy(true);
        try {
            const res = await fetch('/api/ml/generate-memory-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source: 'notes' }),
            });
            if (!res.ok) throw new Error('Generator unavailable');
            const body = (await res.json()) as {
                cards?: {
                    front?: string;
                    back?: string;
                    question?: string;
                    answer?: string;
                }[];
            };
            const rows = (body.cards ?? []).map((card) => ({
                front: card.front ?? card.question ?? '',
                back: card.back ?? card.answer ?? '',
            }));
            await saveRows(rows, 'Generated from notes');
            setText('');
        } catch {
            const rows = parseMarkdownCards(text);
            if (rows.length > 0) await saveRows(rows, 'Generated from notes');
            else toast.error('Card generation failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Import Cards
                </h2>
                <Upload size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-3">
                {deckOptions.length > 0 ? (
                    <select
                        value={activeDeckId}
                        onChange={(event) => setDeckId(event.target.value)}
                        className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        {deckOptions.map((deck) => (
                            <option key={deck.id} value={deck.id}>
                                {deck.title}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        value={newDeckTitle}
                        onChange={(event) =>
                            setNewDeckTitle(event.target.value)
                        }
                        placeholder="New deck name"
                        className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.tsv,.txt,.md,.markdown"
                    className="hidden"
                    onChange={handleFile}
                />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <FileText size={15} />
                    CSV, Anki, or Markdown
                </button>
                <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Paste notes, highlights, or front/back lines"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <button
                    type="button"
                    onClick={() => void generateFromText()}
                    disabled={busy || !text.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                    <Sparkles size={15} />
                    Generate Cards from Text
                </button>
            </div>
        </section>
    );
}

function parseMarkdownCards(raw: string) {
    const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const rows: { front: string; back: string }[] = [];
    for (const line of lines) {
        const qa = line.match(
            /^(?:[-*]\s*)?(?:Q:)?\s*(.*?)\s*(?:=>|::|\t| - | A: )\s*(.*)$/i,
        );
        if (qa?.[1] && qa[2]) rows.push({ front: qa[1], back: qa[2] });
    }
    return rows;
}
