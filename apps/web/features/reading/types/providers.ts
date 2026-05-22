import type {
    ReadingDocument,
    ReadingVersion,
    ReadingStructure,
    ReadingRenderMode,
} from './document';
import type { ReadingPosition } from './positions';
import type { ReadingContent } from './content';
import type { ReadingCitation } from './annotations';

export interface ReadingProviderCapabilities {
    fullText: boolean;
    search: boolean;
    versionComparison: boolean;
    crossReferences: boolean;
    pdfRendering: boolean;
    epubLocations: boolean;
    offlineCaching: boolean;
    highlights: boolean;
    notes: boolean;
    bookmarks: boolean;
    providerEmbed: boolean;
    aiSummarizationAllowed: boolean;
    exportAllowed: boolean;
    renderModes: ReadingRenderMode[];
}

export interface ReadingListOptions {
    type?: ReadingDocument['type'];
    language?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface ReadingContentContext {
    includeFootnotes?: boolean;
    includeOriginalLanguage?: boolean;
    includeCrossRefs?: boolean;
    verseCount?: number;
    pageCount?: number;
}

export interface ReadingContentRequest {
    documentId: string;
    versionId?: string;
    position: ReadingPosition;
    context?: ReadingContentContext;
}

export interface ReadingContentResult {
    documentId: string;
    versionId?: string;
    position: ReadingPosition;
    content: ReadingContent;
    previousPosition?: ReadingPosition;
    nextPosition?: ReadingPosition;
    totalPositions?: number;
}

export interface ReadingSearchRequest {
    documentId: string;
    versionId?: string;
    query: string;
    type: 'phrase' | 'reference' | 'topic';
    limit?: number;
    offset?: number;
}

export interface ReadingSearchHit {
    position: ReadingPosition;
    preview: string;
    reference?: string;
    score?: number;
}

export interface ReadingSearchResult {
    query: string;
    results: ReadingSearchHit[];
    totalCount: number;
    nextOffset?: number;
}

export interface ReadingProvider {
    id: string;
    name: string;
    description?: string;
    capabilities: ReadingProviderCapabilities;

    listDocuments(options?: ReadingListOptions): Promise<ReadingDocument[]>;
    getDocument(documentId: string): Promise<ReadingDocument>;
    getVersions?(documentId: string): Promise<ReadingVersion[]>;
    getStructure(
        documentId: string,
        versionId?: string,
    ): Promise<ReadingStructure>;
    getContent(request: ReadingContentRequest): Promise<ReadingContentResult>;
    search?(request: ReadingSearchRequest): Promise<ReadingSearchResult>;
    getCitation?(
        position: ReadingPosition,
        versionId?: string,
    ): Promise<ReadingCitation>;
    resolveReference?(reference: string): Promise<ReadingPosition | null>;
}
