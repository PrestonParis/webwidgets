import { useState, useEffect, useCallback } from 'react';
import { readingApi } from '@/features/reading/api/readingApi';
import type {
    ReadingBookmark,
    ReadingHighlight,
    ReadingNote,
} from '@/features/reading/types/annotations';
import type { ReadingPosition } from '@/features/reading/types/positions';

interface UseReadingStateReturn {
    bookmarks: ReadingBookmark[];
    highlights: ReadingHighlight[];
    notes: ReadingNote[];
    loading: boolean;
    addBookmark: (pos: ReadingPosition, label?: string) => Promise<void>;
    removeBookmark: (id: string) => Promise<void>;
    addHighlight: (
        start: ReadingPosition,
        end: ReadingPosition,
        text: string,
        color?: string,
    ) => Promise<void>;
    removeHighlight: (id: string) => Promise<void>;
    addNote: (pos: ReadingPosition, content: string) => Promise<void>;
    updateNote: (id: string, content: string) => Promise<void>;
    removeNote: (id: string) => Promise<void>;
}

export function useReadingState(
    documentId: string | null,
): UseReadingStateReturn {
    const [bookmarks, setBookmarks] = useState<ReadingBookmark[]>([]);
    const [highlights, setHighlights] = useState<ReadingHighlight[]>([]);
    const [notes, setNotes] = useState<ReadingNote[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!documentId) return;
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            setLoading(true);
            void Promise.all([
                readingApi.listBookmarks(documentId),
                readingApi.listHighlights(documentId),
                readingApi.listNotes(documentId),
            ])
                .then(([bm, hl, nt]) => {
                    if (cancelled) return;
                    setBookmarks(bm);
                    setHighlights(hl);
                    setNotes(nt);
                    setLoading(false);
                })
                .catch(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [documentId]);

    const addBookmark = useCallback(
        async (pos: ReadingPosition, label?: string) => {
            if (!documentId) return;
            const created = await readingApi.createBookmark(
                documentId,
                pos,
                label,
            );
            setBookmarks((prev) => [...prev, created]);
        },
        [documentId],
    );

    const removeBookmark = useCallback(async (id: string) => {
        await readingApi.deleteBookmark(id);
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }, []);

    const addHighlight = useCallback(
        async (
            start: ReadingPosition,
            end: ReadingPosition,
            text: string,
            color = 'yellow',
        ) => {
            if (!documentId) return;
            const created = await readingApi.createHighlight(
                documentId,
                start,
                end,
                text,
                color,
            );
            setHighlights((prev) => [...prev, created]);
        },
        [documentId],
    );

    const removeHighlight = useCallback(async (id: string) => {
        await readingApi.deleteHighlight(id);
        setHighlights((prev) => prev.filter((h) => h.id !== id));
    }, []);

    const addNote = useCallback(
        async (pos: ReadingPosition, content: string) => {
            if (!documentId) return;
            const created = await readingApi.createNote(
                documentId,
                pos,
                content,
            );
            setNotes((prev) => [...prev, created]);
        },
        [documentId],
    );

    const updateNote = useCallback(async (id: string, content: string) => {
        const updated = await readingApi.updateNote(id, content);
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }, []);

    const removeNote = useCallback(async (id: string) => {
        await readingApi.deleteNote(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return {
        bookmarks,
        highlights,
        notes,
        loading,
        addBookmark,
        removeBookmark,
        addHighlight,
        removeHighlight,
        addNote,
        updateNote,
        removeNote,
    };
}
