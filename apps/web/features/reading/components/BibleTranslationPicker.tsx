'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, Plus, Loader2 } from 'lucide-react';
import {
    loadBibleLibrary,
    saveBibleLibrary,
    type SavedBibleTranslation,
} from '@/features/reading/lib/readingStorage';

interface ApiBibleEntry {
    id: string;
    name: string;
    nameLocal?: string;
    abbreviation?: string;
    abbreviationLocal?: string;
    language: { id: string; name: string; nameLocal: string };
}

interface BibleTranslationPickerProps {
    onClose: () => void;
    onLibraryChange: () => void;
}

export function BibleTranslationPicker({
    onClose,
    onLibraryChange,
}: BibleTranslationPickerProps) {
    const [all, setAll] = useState<ApiBibleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [saved, setSaved] = useState<SavedBibleTranslation[]>(() =>
        loadBibleLibrary(),
    );

    const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved]);

    useEffect(() => {
        apiRouteFetch('/api/bible?path=/bibles')
            .then(async (r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                const data = (await r.json()) as { data: ApiBibleEntry[] };
                setAll(data.data ?? []);
            })
            .catch(() =>
                setError(
                    'Could not load translations. Check your Bible API key.',
                ),
            )
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return all;
        return all.filter(
            (b) =>
                (b.nameLocal ?? b.name).toLowerCase().includes(q) ||
                (b.abbreviationLocal ?? b.abbreviation ?? '')
                    .toLowerCase()
                    .includes(q) ||
                b.language.name.toLowerCase().includes(q) ||
                b.language.nameLocal.toLowerCase().includes(q),
        );
    }, [all, query]);

    function toggle(bible: ApiBibleEntry) {
        const id = bible.id;
        let next: SavedBibleTranslation[];
        if (savedIds.has(id)) {
            next = saved.filter((s) => s.id !== id);
        } else {
            next = [
                ...saved,
                {
                    id,
                    title: bible.nameLocal ?? bible.name,
                    language: bible.language.id,
                    abbreviation:
                        bible.abbreviationLocal ?? bible.abbreviation ?? '',
                },
            ];
        }
        setSaved(next);
        saveBibleLibrary(next);
        onLibraryChange();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div
                className="flex w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                style={{ maxHeight: '80vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Add Bible Translations
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {saved.length === 0
                                ? 'No translations in your library yet'
                                : `${saved.length} in your library`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search by name, abbreviation, or language…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-400">
                            <Loader2 size={14} className="animate-spin" />
                            Loading translations…
                        </div>
                    )}
                    {error && (
                        <p className="px-5 py-8 text-center text-xs text-red-500">
                            {error}
                        </p>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                        <p className="px-5 py-8 text-center text-xs text-zinc-400">
                            No translations match &ldquo;{query}&rdquo;
                        </p>
                    )}
                    {!loading &&
                        !error &&
                        filtered.map((bible) => {
                            const isAdded = savedIds.has(bible.id);
                            const title = bible.nameLocal ?? bible.name;
                            const abbr =
                                bible.abbreviationLocal ?? bible.abbreviation;
                            const lang =
                                bible.language.nameLocal ?? bible.language.name;

                            return (
                                <button
                                    key={bible.id}
                                    type="button"
                                    onClick={() => toggle(bible)}
                                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                >
                                    <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                            isAdded
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-zinc-300 dark:border-zinc-600'
                                        }`}
                                    >
                                        {isAdded ? (
                                            <Check
                                                size={11}
                                                className="text-white"
                                            />
                                        ) : (
                                            <Plus
                                                size={11}
                                                className="text-zinc-400"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {title}
                                            {abbr && (
                                                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                                                    {abbr}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                            {lang}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
