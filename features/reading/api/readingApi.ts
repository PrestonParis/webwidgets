// All fetch calls for reading annotations and progress live here.
// Components and hooks import from this module — never call fetch directly.

import type {
    ReadingBookmark,
    ReadingHighlight,
    ReadingNote,
} from '@/features/reading/types/annotations';
import type { ReadingProgress } from '@/features/reading/types/plans';
import type { ReadingPosition } from '@/features/reading/types/positions';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) throw new Error(`Reading API error ${res.status}: ${url}`);
    return res.json() as Promise<T>;
}

export const readingApi = {
    // Bookmarks
    listBookmarks: (documentId: string) =>
        apiFetch<ReadingBookmark[]>(
            `/api/reading/bookmarks?documentId=${documentId}`,
        ),

    createBookmark: (
        documentId: string,
        position: ReadingPosition,
        label?: string,
    ) =>
        apiFetch<ReadingBookmark>('/api/reading/bookmarks', {
            method: 'POST',
            body: JSON.stringify({
                documentId,
                position,
                ...(label !== undefined && { label }),
            }),
        }),

    deleteBookmark: (id: string) =>
        apiFetch<{ ok: true }>(`/api/reading/bookmarks?id=${id}`, {
            method: 'DELETE',
        }),

    // Highlights
    listHighlights: (documentId: string) =>
        apiFetch<ReadingHighlight[]>(
            `/api/reading/highlights?documentId=${documentId}`,
        ),

    createHighlight: (
        documentId: string,
        positionStart: ReadingPosition,
        positionEnd: ReadingPosition,
        textSnippet: string,
        color: string,
    ) =>
        apiFetch<ReadingHighlight>('/api/reading/highlights', {
            method: 'POST',
            body: JSON.stringify({
                documentId,
                positionStart,
                positionEnd,
                textSnippet,
                color,
            }),
        }),

    deleteHighlight: (id: string) =>
        apiFetch<{ ok: true }>(`/api/reading/highlights?id=${id}`, {
            method: 'DELETE',
        }),

    // Notes
    listNotes: (documentId: string) =>
        apiFetch<ReadingNote[]>(`/api/reading/notes?documentId=${documentId}`),

    createNote: (
        documentId: string,
        position: ReadingPosition,
        content: string,
    ) =>
        apiFetch<ReadingNote>('/api/reading/notes', {
            method: 'POST',
            body: JSON.stringify({ documentId, position, content }),
        }),

    updateNote: (id: string, content: string) =>
        apiFetch<ReadingNote>('/api/reading/notes', {
            method: 'PATCH',
            body: JSON.stringify({ id, content }),
        }),

    deleteNote: (id: string) =>
        apiFetch<{ ok: true }>(`/api/reading/notes?id=${id}`, {
            method: 'DELETE',
        }),

    // Progress
    getProgress: (documentId: string) =>
        apiFetch<ReadingProgress | null>(
            `/api/reading/progress?documentId=${documentId}`,
        ),

    saveProgress: (
        documentId: string,
        position: ReadingPosition,
        percentComplete: number,
    ) =>
        apiFetch<ReadingProgress>('/api/reading/progress', {
            method: 'POST',
            body: JSON.stringify({ documentId, position, percentComplete }),
        }),
};
