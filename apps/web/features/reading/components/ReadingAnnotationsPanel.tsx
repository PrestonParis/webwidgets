'use client';

import { Trash2 } from 'lucide-react';
import type {
    ReadingBookmark,
    ReadingHighlight,
    ReadingNote,
} from '@/features/reading/types/annotations';
import type { ReadingPanel } from './ReadingToolbar';
import { formatPosition } from '@/features/reading/lib/positionUtils';

interface AnnotationsPanelProps {
    activePanel: ReadingPanel;
    bookmarks: ReadingBookmark[];
    highlights: ReadingHighlight[];
    notes: ReadingNote[];
    onDeleteBookmark: (id: string) => void;
    onDeleteHighlight: (id: string) => void;
    onDeleteNote: (id: string) => void;
}

function EmptyState({ label }: { label: string }) {
    return (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
            {label}
        </p>
    );
}

function BookmarksTab({
    bookmarks,
    onDelete,
}: {
    bookmarks: ReadingBookmark[];
    onDelete: (id: string) => void;
}) {
    if (bookmarks.length === 0)
        return (
            <EmptyState label="No bookmarks yet. Mark a position to save it." />
        );
    return (
        <ul className="space-y-2">
            {bookmarks.map((bm) => (
                <li
                    key={bm.id}
                    className="flex items-center justify-between gap-2 text-xs"
                >
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {bm.label ?? formatPosition(bm.position)}
                    </span>
                    <button
                        onClick={() => onDelete(bm.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                </li>
            ))}
        </ul>
    );
}

function HighlightsTab({
    highlights,
    onDelete,
}: {
    highlights: ReadingHighlight[];
    onDelete: (id: string) => void;
}) {
    if (highlights.length === 0)
        return (
            <EmptyState label="No highlights yet. Select text to highlight." />
        );
    return (
        <ul className="space-y-3">
            {highlights.map((hl) => (
                <li key={hl.id} className="flex gap-2">
                    <div
                        className={`w-1 rounded-full shrink-0 bg-${hl.color}-400`}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
                            {hl.textSnippet}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                            {formatPosition(hl.positionStart)}
                        </p>
                    </div>
                    <button
                        onClick={() => onDelete(hl.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                    >
                        <Trash2 size={12} />
                    </button>
                </li>
            ))}
        </ul>
    );
}

function NotesTab({
    notes,
    onDelete,
}: {
    notes: ReadingNote[];
    onDelete: (id: string) => void;
}) {
    if (notes.length === 0)
        return (
            <EmptyState label="No notes yet. Click beside a verse to add a note." />
        );
    return (
        <ul className="space-y-3">
            {notes.map((note) => (
                <li key={note.id} className="flex gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3">
                            {note.content}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                            {formatPosition(note.position)}
                        </p>
                    </div>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                    >
                        <Trash2 size={12} />
                    </button>
                </li>
            ))}
        </ul>
    );
}

export function ReadingAnnotationsPanel({
    activePanel,
    bookmarks,
    highlights,
    notes,
    onDeleteBookmark,
    onDeleteHighlight,
    onDeleteNote,
}: AnnotationsPanelProps) {
    if (
        activePanel !== 'bookmarks' &&
        activePanel !== 'highlights' &&
        activePanel !== 'notes'
    )
        return null;
    return (
        <div className="w-64 shrink-0 border-l border-gray-100 dark:border-zinc-800 overflow-y-auto">
            <div className="p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {activePanel === 'bookmarks'
                        ? 'Bookmarks'
                        : activePanel === 'highlights'
                          ? 'Highlights'
                          : 'Notes'}
                </h3>
                {activePanel === 'bookmarks' && (
                    <BookmarksTab
                        bookmarks={bookmarks}
                        onDelete={onDeleteBookmark}
                    />
                )}
                {activePanel === 'highlights' && (
                    <HighlightsTab
                        highlights={highlights}
                        onDelete={onDeleteHighlight}
                    />
                )}
                {activePanel === 'notes' && (
                    <NotesTab notes={notes} onDelete={onDeleteNote} />
                )}
            </div>
        </div>
    );
}
