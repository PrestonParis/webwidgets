import type { ReadingPosition } from './positions';

export type ReadingDocumentType =
    | 'religious_text'
    | 'pdf'
    | 'epub'
    | 'web'
    | 'provider_embed';

export type ReadingPermission =
    | 'read'
    | 'highlight'
    | 'annotate'
    | 'export'
    | 'share'
    | 'ai_summarize'
    | 'search'
    | 'download';

export type ReligiousTradition =
    | 'christian'
    | 'catholic'
    | 'orthodox'
    | 'jewish'
    | 'islamic'
    | 'general';

export type ReadingRenderMode =
    | 'structured_text'
    | 'pdf_canvas'
    | 'ebook_flow'
    | 'provider_embed'
    | 'image_pages'
    | 'parallel_compare'
    | 'study_mode';

export interface ReadingSource {
    id: string;
    type: 'api' | 's3' | 'url' | 'embed' | 'inline';
    url?: string;
    s3Key?: string;
    embedUrl?: string;
    apiEndpoint?: string;
    requiresAuth: boolean;
    cacheable: boolean;
}

export interface ReadingDocumentMetadata {
    tradition?: ReligiousTradition;
    canonicalOrder?: number;
    testament?: 'old' | 'new' | 'apocrypha';
    isbn?: string;
    publisher?: string;
    edition?: string;
    fileSize?: number;
    mimeType?: string;
    tags?: string[];
    customFields?: Record<string, string | number | boolean>;
}

export interface ReadingDocument {
    id: string;
    providerId: string;
    externalId?: string;
    title: string;
    subtitle?: string;
    author?: string;
    description?: string;
    type: ReadingDocumentType;
    language: string;
    originalLanguage?: string;
    source: ReadingSource;
    metadata: ReadingDocumentMetadata;
    permissions: ReadingPermission[];
    defaultRenderMode: ReadingRenderMode;
    supportedRenderModes: ReadingRenderMode[];
    thumbnailUrl?: string;
    publishedAt?: string;
    uploadedAt?: string;
    totalPages?: number;
    totalWords?: number;
    estimatedReadTimeMinutes?: number;
}

export interface ReadingVersion {
    id: string;
    documentId: string;
    name: string; // 'ESV', 'NIV', 'Sahih International'
    abbreviation: string;
    language: string;
    tradition?: ReligiousTradition;
    year?: number;
    publisher?: string;
    description?: string;
    isDefault?: boolean;
    requiresSubscription?: boolean;
}

export interface ReadingBook {
    id: string;
    documentId: string;
    versionId?: string;
    name: string;
    shortName?: string;
    canonicalOrder: number;
    totalChapters: number;
    testament?: 'old' | 'new' | 'apocrypha';
    division?: string; // 'Torah', 'Gospels', 'Epistles'
}

export interface ReadingChapter {
    id: string;
    documentId: string;
    bookId?: string;
    versionId?: string;
    chapterNumber: number;
    localName?: string; // 'Al-Fatihah'
    totalVerses?: number;
    totalWords?: number;
}

export interface ReadingSection {
    id: string;
    chapterId: string;
    title?: string;
    startVerse?: number;
    endVerse?: number;
}

export interface ReadingStructure {
    documentId: string;
    versionId?: string;
    books?: ReadingBook[];
    chapters?: ReadingChapter[];
    totalPages?: number;
    hasVerses: boolean;
    hasPages: boolean;
    hasEpubLocations: boolean;
}

export interface ReadingCrossReference {
    fromPosition: ReadingPosition;
    toPosition: ReadingPosition;
    toDocument?: string;
    label?: string;
    type:
        | 'parallel'
        | 'allusion'
        | 'quotation'
        | 'thematic'
        | 'prophecy_fulfillment';
}
