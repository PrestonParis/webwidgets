import type {
    ReadingPosition,
    CanonicalPosition,
} from '@/features/reading/types/positions';

export function formatPosition(pos: ReadingPosition): string {
    if (pos.type === 'canonical') return formatCanonical(pos);
    if (pos.type === 'page') return `Page ${pos.page}`;
    if (pos.type === 'epub') return `${Math.round(pos.percentComplete)}%`;
    if (pos.type === 'percent') return `${Math.round(pos.percentComplete)}%`;
    return 'Unknown position';
}

function formatCanonical(pos: CanonicalPosition): string {
    let ref = `${pos.book} ${pos.chapter}`;
    if (pos.verse !== undefined) {
        ref += `:${pos.verse}`;
        if (pos.verseEnd !== undefined && pos.verseEnd !== pos.verse) {
            ref += `–${pos.verseEnd}`;
        }
    }
    return ref;
}

export function positionsEqual(
    a: ReadingPosition,
    b: ReadingPosition,
): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'canonical' && b.type === 'canonical') {
        return (
            a.book === b.book && a.chapter === b.chapter && a.verse === b.verse
        );
    }
    if (a.type === 'page' && b.type === 'page') return a.page === b.page;
    if (a.type === 'epub' && b.type === 'epub') return a.cfi === b.cfi;
    if (a.type === 'percent' && b.type === 'percent') {
        return Math.abs(a.percentComplete - b.percentComplete) < 0.01;
    }
    return false;
}

export function parseCanonicalReference(ref: string): CanonicalPosition | null {
    // Matches: "John 3:16", "Genesis 1", "Romans 8:1-39"
    const match = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:[-–](\d+))?)?$/);
    if (!match) return null;
    const [, book, chapterStr, verseStr, verseEndStr] = match;
    if (!book || !chapterStr) return null;
    const chapter = parseInt(chapterStr, 10);
    const pos: CanonicalPosition = {
        type: 'canonical',
        book: book.trim(),
        chapter,
    };
    if (verseStr) pos.verse = parseInt(verseStr, 10);
    if (verseEndStr) pos.verseEnd = parseInt(verseEndStr, 10);
    return pos;
}

export function canonicalKey(pos: CanonicalPosition): string {
    let key = `${pos.book}.${pos.chapter}`;
    if (pos.verse !== undefined) key += `.${pos.verse}`;
    return key;
}
