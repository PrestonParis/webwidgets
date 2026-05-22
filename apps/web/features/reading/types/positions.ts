// Position types describe where a reader is in a document.
// They are polymorphic — each document type uses a different coordinate system.

export interface CanonicalPosition {
    type: 'canonical';
    book: string; // 'Genesis', 'John', 'Al-Baqarah'
    chapter: number;
    verse?: number;
    verseEnd?: number;
}

export interface PagePosition {
    type: 'page';
    page: number;
    scrollY?: number;
    textAnchor?: string; // extracted text anchor for scroll-to
}

export interface EpubPosition {
    type: 'epub';
    cfi: string; // EPUB Canonical Fragment Identifier
    percentComplete: number;
}

export interface PercentPosition {
    type: 'percent';
    percentComplete: number;
}

// Provider controls rendering; we only store opaque metadata
export interface OpaquePosition {
    type: 'opaque';
    providerData: Record<string, string | number | boolean>;
}

export type ReadingPosition =
    | CanonicalPosition
    | PagePosition
    | EpubPosition
    | PercentPosition
    | OpaquePosition;

export function isCanonicalPosition(
    p: ReadingPosition,
): p is CanonicalPosition {
    return p.type === 'canonical';
}

export function isPagePosition(p: ReadingPosition): p is PagePosition {
    return p.type === 'page';
}

export function isEpubPosition(p: ReadingPosition): p is EpubPosition {
    return p.type === 'epub';
}

export function percentOf(p: ReadingPosition): number {
    if (p.type === 'percent') return p.percentComplete;
    if (p.type === 'epub') return p.percentComplete;
    return 0;
}
