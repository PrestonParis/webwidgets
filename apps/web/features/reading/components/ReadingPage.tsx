'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BookOpen,
    FileText,
    Search,
    Upload,
    ChevronRight,
    BookMarked,
    Highlighter,
    StickyNote,
    X,
    Play,
    Book,
} from 'lucide-react';
import { useReadingWidget } from '@/features/reading/hooks/useReadingWidget';
import { useReadingLibrary } from '@/features/reading/hooks/useReadingLibrary';
import { ReadingToolbar } from './ReadingToolbar';
import { ReadingDocumentView } from './ReadingDocumentView';
import { ReadingAnnotationsPanel } from './ReadingAnnotationsPanel';
import { ReadingProgressBar } from './ReadingProgressBar';
import { loadLastPosition } from '@/features/reading/lib/readingStorage';
import { bootstrapProviders } from '@/features/reading/providers/index';
import type { ReadingDocument } from '@/features/reading/types/document';
import { BibleTranslationPicker } from './BibleTranslationPicker';

// ─── types ────────────────────────────────────────────────────────────────────

interface BibleBook {
    id: string;
    name: string;
    chapters: number;
}

const OT_BOOKS: BibleBook[] = [
    { id: 'GEN', name: 'Genesis', chapters: 50 },
    { id: 'EXO', name: 'Exodus', chapters: 40 },
    { id: 'LEV', name: 'Leviticus', chapters: 27 },
    { id: 'NUM', name: 'Numbers', chapters: 36 },
    { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
    { id: 'PSA', name: 'Psalms', chapters: 150 },
    { id: 'PRO', name: 'Proverbs', chapters: 31 },
    { id: 'ISA', name: 'Isaiah', chapters: 66 },
];

const NT_BOOKS: BibleBook[] = [
    { id: 'MAT', name: 'Matthew', chapters: 28 },
    { id: 'MRK', name: 'Mark', chapters: 16 },
    { id: 'LUK', name: 'Luke', chapters: 24 },
    { id: 'JHN', name: 'John', chapters: 21 },
    { id: 'ACT', name: 'Acts', chapters: 28 },
    { id: 'ROM', name: 'Romans', chapters: 16 },
    { id: '1CO', name: '1 Corinthians', chapters: 16 },
    { id: 'REV', name: 'Revelation', chapters: 22 },
];

const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

// ─── continue reading banner ───────────────────────────────────────────────────

function ContinueReadingBanner({
    documents,
    onOpen,
}: {
    documents: ReadingDocument[];
    onOpen: (id: string) => void;
}) {
    const [lastDoc, setLastDoc] = useState<{
        document: ReadingDocument;
        label: string;
    } | null>(null);

    useEffect(() => {
        if (documents.length === 0) return;
        for (const doc of documents) {
            const pos = loadLastPosition(doc.id);
            if (!pos) continue;
            let label = doc.title;
            if (pos.type === 'canonical') {
                label = `${pos.book} ${pos.chapter}`;
            } else if (pos.type === 'page') {
                label = `${doc.title}, page ${pos.page}`;
            }
            setLastDoc({ document: doc, label });
            return;
        }
    }, [documents]);

    if (!lastDoc) return null;

    return (
        <button
            type="button"
            onClick={() => onOpen(lastDoc.document.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
        >
            <Play
                size={15}
                className="shrink-0 text-blue-600 dark:text-blue-400"
            />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Continue reading
                </p>
                <p className="truncate text-sm font-medium text-blue-900 dark:text-blue-100">
                    {lastDoc.label}
                </p>
            </div>
            <ChevronRight size={15} className="shrink-0 text-blue-500" />
        </button>
    );
}

// ─── document card ─────────────────────────────────────────────────────────────

function DocumentCard({
    doc,
    onOpen,
}: {
    doc: ReadingDocument;
    onOpen: (id: string) => void;
}) {
    const hasProgress = typeof doc.estimatedReadTimeMinutes === 'number';
    return (
        <button
            type="button"
            onClick={() => onOpen(doc.id)}
            className="group flex items-start gap-3 w-full rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {doc.type === 'religious_text' ? (
                    <BookOpen size={15} className="text-blue-600" />
                ) : (
                    <FileText size={15} className="text-zinc-500" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {doc.title}
                </p>
                {doc.author && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {doc.author}
                    </p>
                )}
                {hasProgress && (
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        ~{doc.estimatedReadTimeMinutes} min read
                    </p>
                )}
            </div>
            <ChevronRight
                size={14}
                className="mt-1 shrink-0 text-zinc-300 transition group-hover:text-blue-400 dark:text-zinc-600"
            />
        </button>
    );
}

// ─── library section ───────────────────────────────────────────────────────────

function LibrarySection({ onOpen }: { onOpen: (id: string) => void }) {
    const { documents, loading, search, setSearch } = useReadingLibrary();
    const [showSearch, setShowSearch] = useState(false);

    const pdfs = documents.filter((d) => d.type === 'pdf' || d.type === 'epub');
    const religious = documents.filter((d) => d.type === 'religious_text');

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    My Library
                </h2>
                <button
                    type="button"
                    onClick={() => setShowSearch((v) => !v)}
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                    <Search size={14} />
                </button>
            </div>

            {showSearch && (
                <div className="mb-3 relative">
                    <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search documents…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
            ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                    <FileText
                        size={24}
                        className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600"
                    />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        No documents yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Import a PDF or ebook to start reading
                    </p>
                    <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                        <Upload size={12} />
                        Import document
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {search === '' && religious.length > 0 && (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Scripture
                        </p>
                    )}
                    {search === '' &&
                        religious.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onOpen={onOpen}
                            />
                        ))}
                    {search === '' && pdfs.length > 0 && (
                        <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Documents
                        </p>
                    )}
                    {search === ''
                        ? pdfs.map((doc) => (
                              <DocumentCard
                                  key={doc.id}
                                  doc={doc}
                                  onOpen={onOpen}
                              />
                          ))
                        : documents.map((doc) => (
                              <DocumentCard
                                  key={doc.id}
                                  doc={doc}
                                  onOpen={onOpen}
                              />
                          ))}
                </div>
            )}
        </section>
    );
}

// ─── bible quick open ──────────────────────────────────────────────────────────

function BibleSection({
    documents,
    onNavigate,
    onLibraryChange,
}: {
    documents: ReadingDocument[];
    onNavigate: (docId: string, book: string, chapter: number) => void;
    onLibraryChange: () => void;
}) {
    const bibles = documents.filter((d) => d.type === 'religious_text');
    const [selectedDocId, setSelectedDocId] = useState('');
    const [bookId, setBookId] = useState('JHN');
    const [chapter, setChapter] = useState(1);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (selectedDocId || bibles.length === 0) return;
        const eng = bibles.find((b) => b.language === 'eng') ?? bibles[0]!;
        setSelectedDocId(eng.id);
    }, [bibles, selectedDocId]);

    const selectedBook =
        ALL_BOOKS.find((b) => b.id === bookId) ?? ALL_BOOKS[0]!;
    const chapterCount = selectedBook.chapters;

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookMarked
                        size={15}
                        className="text-amber-600 dark:text-amber-400"
                    />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Bible
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <Book size={11} />
                    {bibles.length === 0 ? 'Add translation' : 'Manage'}
                </button>
            </div>

            {bibles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                    <BookMarked
                        size={20}
                        className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600"
                    />
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        No translations in your library
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Add a Bible translation to start reading scripture.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                    >
                        <Book size={12} />
                        Add translation
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Translation
                            </label>
                            <select
                                value={selectedDocId}
                                onChange={(e) =>
                                    setSelectedDocId(e.target.value)
                                }
                                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            >
                                {bibles.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Book
                                </label>
                                <select
                                    value={bookId}
                                    onChange={(e) => {
                                        setBookId(e.target.value);
                                        setChapter(1);
                                    }}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                >
                                    <optgroup label="Old Testament">
                                        {OT_BOOKS.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="New Testament">
                                        {NT_BOOKS.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Chapter
                                </label>
                                <select
                                    value={chapter}
                                    onChange={(e) =>
                                        setChapter(Number(e.target.value))
                                    }
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                >
                                    {Array.from(
                                        { length: chapterCount },
                                        (_, i) => i + 1,
                                    ).map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                selectedDocId &&
                                onNavigate(
                                    selectedDocId,
                                    selectedBook.name,
                                    chapter,
                                )
                            }
                            disabled={!selectedDocId}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
                        >
                            <Book size={14} />
                            Open {selectedBook.name} {chapter}
                        </button>
                    </div>
                </div>
            )}

            {showPicker && (
                <BibleTranslationPicker
                    onClose={() => setShowPicker(false)}
                    onLibraryChange={() => {
                        onLibraryChange();
                        setSelectedDocId('');
                    }}
                />
            )}
        </section>
    );
}

// ─── recent annotations panel ──────────────────────────────────────────────────

function RecentAnnotationsPanel({
    highlights,
    notes,
    onOpen,
}: {
    highlights: Array<{
        id: string;
        textSnippet: string;
        documentId: string;
        createdAt: string;
    }>;
    notes: Array<{
        id: string;
        content: string;
        documentId: string;
        createdAt: string;
    }>;
    onOpen: (id: string) => void;
}) {
    if (highlights.length === 0 && notes.length === 0) return null;

    return (
        <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Recent Annotations
            </h2>
            <div className="space-y-2">
                {highlights.slice(0, 3).map((h) => (
                    <button
                        key={h.id}
                        type="button"
                        onClick={() => onOpen(h.documentId)}
                        className="flex w-full items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-left transition hover:bg-yellow-100 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/40"
                    >
                        <Highlighter
                            size={13}
                            className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"
                        />
                        <p className="line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                            {h.textSnippet}
                        </p>
                    </button>
                ))}
                {notes.slice(0, 2).map((n) => (
                    <button
                        key={n.id}
                        type="button"
                        onClick={() => onOpen(n.documentId)}
                        className="flex w-full items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                    >
                        <StickyNote
                            size={13}
                            className="mt-0.5 shrink-0 text-zinc-500"
                        />
                        <p className="line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                            {n.content}
                        </p>
                    </button>
                ))}
            </div>
        </section>
    );
}

// ─── reader view ───────────────────────────────────────────────────────────────

function ReaderView({
    widget,
}: {
    widget: ReturnType<typeof useReadingWidget>;
}) {
    const {
        closeDocument,
        setActivePanel,
        activePanel,
        docState,
        annotState,
        prefs,
        searchState,
    } = widget;

    const {
        document,
        versions,
        structure,
        activeVersionId,
        position,
        loading: docLoading,
    } = docState;

    const {
        bookmarks,
        highlights,
        notes,
        removeBookmark,
        removeHighlight,
        removeNote,
    } = annotState;

    const progressPct =
        position?.type === 'percent' || position?.type === 'epub'
            ? position.percentComplete
            : 0;
    const pageLabel =
        position?.type === 'page' && document?.totalPages
            ? `${position.page} / ${document.totalPages}`
            : null;

    if (docLoading || !document) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <ReadingToolbar
                title={document.title}
                versions={versions}
                activeVersionId={activeVersionId}
                structure={structure}
                position={position}
                activePanel={activePanel}
                onVersionChange={docState.setVersion}
                onNavigate={docState.navigateChapter}
                onJump={docState.navigate}
                onPanelToggle={setActivePanel}
                onClose={closeDocument}
            />
            {position && (
                <ReadingProgressBar
                    percent={progressPct}
                    {...(pageLabel !== null ? { label: pageLabel } : {})}
                />
            )}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden">
                    {position ? (
                        <ReadingDocumentView
                            document={document}
                            position={position}
                            versionId={activeVersionId}
                            prefs={prefs}
                            onPageChange={(page) =>
                                docState.navigate({ type: 'page', page })
                            }
                        />
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-sm text-zinc-400">
                                Select a chapter to begin reading.
                            </p>
                        </div>
                    )}
                </div>
                {(activePanel === 'bookmarks' ||
                    activePanel === 'highlights' ||
                    activePanel === 'notes') && (
                    <ReadingAnnotationsPanel
                        activePanel={activePanel}
                        bookmarks={bookmarks}
                        highlights={highlights}
                        notes={notes}
                        onDeleteBookmark={(id) => void removeBookmark(id)}
                        onDeleteHighlight={(id) => void removeHighlight(id)}
                        onDeleteNote={(id) => void removeNote(id)}
                    />
                )}
                {activePanel === 'search' && (
                    <div className="flex w-72 shrink-0 flex-col border-l border-gray-100 dark:border-zinc-800">
                        <div className="flex gap-2 border-b border-gray-100 p-3 dark:border-zinc-800">
                            <input
                                type="text"
                                value={searchState.query}
                                onChange={(e) =>
                                    searchState.setQuery(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && searchState.search()
                                }
                                placeholder="Search…"
                                className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            <button
                                onClick={searchState.search}
                                className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs text-white"
                            >
                                Go
                            </button>
                            <button
                                onClick={searchState.clear}
                                className="rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 p-3">
                            {searchState.loading && (
                                <p className="text-xs text-zinc-400">
                                    Searching…
                                </p>
                            )}
                            {searchState.results.map((r, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border border-gray-100 p-2 dark:border-zinc-800"
                                >
                                    {r.reference && (
                                        <p className="mb-0.5 text-[10px] font-semibold text-blue-600">
                                            {r.reference}
                                        </p>
                                    )}
                                    <p className="line-clamp-3 text-xs text-zinc-600 dark:text-zinc-400">
                                        {r.preview}
                                    </p>
                                </div>
                            ))}
                            {!searchState.loading &&
                                searchState.results.length === 0 &&
                                searchState.query && (
                                    <p className="py-6 text-center text-xs text-zinc-400">
                                        No results.
                                    </p>
                                )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function ReadingPage() {
    const widget = useReadingWidget();
    const { activeDocumentId, openDocument, docState } = widget;
    const { documents, loading: libLoading, reload } = useReadingLibrary();

    useEffect(() => {
        bootstrapProviders();
    }, []);

    const handleNavigate = useCallback(
        (docId: string, book: string, chapter: number) => {
            openDocument(docId);
            // Navigate after document loads
            const tryNav = () => {
                if (docState.navigate) {
                    docState.navigate({
                        type: 'canonical',
                        book,
                        chapter,
                    });
                }
            };
            setTimeout(tryNav, 800);
        },
        [openDocument, docState],
    );

    return (
        <main
            id="main-content"
            className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950"
        >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Reading
                    </h1>
                </div>
                {!activeDocumentId && (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <Upload size={12} />
                        Import
                    </button>
                )}
            </div>

            {/* Body */}
            {activeDocumentId ? (
                // ── reading mode ──
                <div className="flex min-h-0 flex-1">
                    <ReaderView widget={widget} />
                </div>
            ) : (
                // ── browse mode ──
                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Library */}
                    <div className="flex w-full flex-col gap-5 overflow-y-auto border-r border-zinc-200 p-6 dark:border-zinc-800 md:w-[calc(100%-320px)] lg:w-[calc(100%-360px)]">
                        {!libLoading && (
                            <ContinueReadingBanner
                                documents={documents}
                                onOpen={openDocument}
                            />
                        )}
                        <LibrarySection onOpen={openDocument} />
                        <RecentAnnotationsPanel
                            highlights={[]}
                            notes={[]}
                            onOpen={openDocument}
                        />
                    </div>

                    {/* Right: Bible + Quick Access */}
                    <div className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto p-6 md:flex lg:w-90">
                        <BibleSection
                            documents={documents}
                            onNavigate={handleNavigate}
                            onLibraryChange={() => void reload()}
                        />

                        {/* Quick actions */}
                        <section>
                            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Quick Actions
                            </h2>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Upload
                                        size={14}
                                        className="shrink-0 text-zinc-400"
                                    />
                                    Import PDF or ebook
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Highlighter
                                        size={14}
                                        className="shrink-0 text-zinc-400"
                                    />
                                    View all highlights
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <StickyNote
                                        size={14}
                                        className="shrink-0 text-zinc-400"
                                    />
                                    View all notes
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </main>
    );
}
