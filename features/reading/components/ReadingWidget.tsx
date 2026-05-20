'use client';

import { useReadingWidget } from '@/features/reading/hooks/useReadingWidget';
import { ReadingLibraryPanel } from './ReadingLibraryPanel';
import { ReadingToolbar } from './ReadingToolbar';
import { ReadingDocumentView } from './ReadingDocumentView';
import { ReadingAnnotationsPanel } from './ReadingAnnotationsPanel';
import { ReadingProgressBar } from './ReadingProgressBar';

// ─── search panel ─────────────────────────────────────────────────────────────

function SearchPanel({
    query,
    results,
    loading,
    error,
    onQuery,
    onSearch,
    onClear,
}: {
    query: string;
    results: Array<{
        position: { type: string };
        preview: string;
        reference?: string;
    }>;
    loading: boolean;
    error: string | null;
    onQuery: (q: string) => void;
    onSearch: () => void;
    onClear: () => void;
}) {
    return (
        <div className="w-72 shrink-0 border-l border-gray-100 dark:border-zinc-800 flex flex-col">
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800 flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder="Search…"
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                />
                <button
                    onClick={onSearch}
                    className="text-xs px-2 py-1.5 bg-[#4f6ef7] text-white rounded-lg"
                >
                    Go
                </button>
                <button
                    onClick={onClear}
                    className="text-xs px-2 py-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                    ✕
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading && <p className="text-xs text-zinc-400">Searching…</p>}
                {error && <p className="text-xs text-red-500">{error}</p>}
                {!loading &&
                    results.map((r, i) => (
                        <div
                            key={i}
                            className="p-2 rounded-lg border border-gray-100 dark:border-zinc-800"
                        >
                            {r.reference && (
                                <p className="text-[10px] font-semibold text-[#4f6ef7] mb-0.5">
                                    {r.reference}
                                </p>
                            )}
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                {r.preview}
                            </p>
                        </div>
                    ))}
                {!loading && results.length === 0 && query && !error && (
                    <p className="text-xs text-zinc-400 text-center py-6">
                        No results.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── widget ───────────────────────────────────────────────────────────────────

export default function ReadingWidget() {
    const {
        activeDocumentId,
        activePanel,
        setActivePanel,
        openDocument,
        closeDocument,
        docState,
        annotState,
        prefs,
        searchState,
    } = useReadingWidget();

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

    if (!activeDocumentId || !document) {
        return (
            <div className="flex flex-col h-full min-h-100">
                <ReadingLibraryPanel onSelect={openDocument} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-100 bg-white dark:bg-zinc-950">
            <ReadingToolbar
                title={docLoading ? 'Loading…' : document.title}
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
            {position &&
                (() => {
                    const pct =
                        position.type === 'percent'
                            ? position.percentComplete
                            : position.type === 'epub'
                              ? position.percentComplete
                              : 0;
                    const pageLabel =
                        position.type === 'page' && document.totalPages
                            ? `${position.page} / ${document.totalPages}`
                            : null;
                    return (
                        <ReadingProgressBar
                            percent={pct}
                            {...(pageLabel !== null && { label: pageLabel })}
                        />
                    );
                })()}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col">
                    {position && (
                        <ReadingDocumentView
                            document={document}
                            position={position}
                            versionId={activeVersionId}
                            prefs={prefs}
                            onPageChange={(page) =>
                                docState.navigate({ type: 'page', page })
                            }
                        />
                    )}
                </div>
                {activePanel === 'search' && (
                    <SearchPanel
                        query={searchState.query}
                        results={searchState.results}
                        loading={searchState.loading}
                        error={searchState.error}
                        onQuery={searchState.setQuery}
                        onSearch={searchState.search}
                        onClear={searchState.clear}
                    />
                )}
                {(activePanel === 'bookmarks' ||
                    activePanel === 'highlights' ||
                    activePanel === 'notes') && (
                    <ReadingAnnotationsPanel
                        activePanel={activePanel}
                        bookmarks={bookmarks}
                        highlights={highlights}
                        notes={notes}
                        onDeleteBookmark={(id) => {
                            void removeBookmark(id);
                        }}
                        onDeleteHighlight={(id) => {
                            void removeHighlight(id);
                        }}
                        onDeleteNote={(id) => {
                            void removeNote(id);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
