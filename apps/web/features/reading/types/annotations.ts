import type { ReadingPosition } from './positions';

export type BookmarkColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple';
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface ReadingBookmark {
    id: string;
    userId: string;
    documentId: string;
    position: ReadingPosition;
    label?: string;
    color: BookmarkColor;
    citation?: string;
    createdAt: string;
}

export interface ReadingHighlight {
    id: string;
    userId: string;
    documentId: string;
    positionStart: ReadingPosition;
    positionEnd: ReadingPosition;
    textSnippet: string;
    color: HighlightColor;
    note?: string;
    citation?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ReadingNote {
    id: string;
    userId: string;
    documentId: string;
    position: ReadingPosition;
    positionEnd?: ReadingPosition;
    content: string;
    citation?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ReadingCitation {
    text: string;
    reference: string; // 'John 3:16 (ESV)'
    documentTitle: string;
    versionName?: string;
    position: ReadingPosition;
    formattedCitation: string;
    formats: {
        short: string; // 'Jn 3:16'
        long: string; // 'John 3:16 (English Standard Version)'
        apa?: string;
        mla?: string;
    };
}

// DB row shapes (snake_case from Supabase)
export interface BookmarkRow {
    id: string;
    user_id: string;
    document_id: string;
    position: ReadingPosition;
    label: string | null;
    color: string;
    citation: string | null;
    created_at: string;
}

export interface HighlightRow {
    id: string;
    user_id: string;
    document_id: string;
    position_start: ReadingPosition;
    position_end: ReadingPosition;
    text_snippet: string;
    color: string;
    note: string | null;
    citation: string | null;
    created_at: string;
    updated_at: string;
}

export interface NoteRow {
    id: string;
    user_id: string;
    document_id: string;
    position: ReadingPosition;
    position_end: ReadingPosition | null;
    content: string;
    citation: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export function rowToBookmark(r: BookmarkRow): ReadingBookmark {
    return {
        id: r.id,
        userId: r.user_id,
        documentId: r.document_id,
        position: r.position,
        color: r.color as BookmarkColor,
        createdAt: r.created_at,
        ...(r.label !== null && { label: r.label }),
        ...(r.citation !== null && { citation: r.citation }),
    };
}

export function rowToHighlight(r: HighlightRow): ReadingHighlight {
    return {
        id: r.id,
        userId: r.user_id,
        documentId: r.document_id,
        positionStart: r.position_start,
        positionEnd: r.position_end,
        textSnippet: r.text_snippet,
        color: r.color as HighlightColor,
        createdAt: r.created_at,
        ...(r.note !== null && { note: r.note }),
        ...(r.citation !== null && { citation: r.citation }),
        ...(r.updated_at && { updatedAt: r.updated_at }),
    };
}

export function rowToNote(r: NoteRow): ReadingNote {
    return {
        id: r.id,
        userId: r.user_id,
        documentId: r.document_id,
        position: r.position,
        content: r.content,
        tags: r.tags,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        ...(r.position_end !== null && { positionEnd: r.position_end }),
        ...(r.citation !== null && { citation: r.citation }),
    };
}
