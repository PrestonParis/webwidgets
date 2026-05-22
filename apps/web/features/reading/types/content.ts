// Content types represent what is rendered in the reading pane.
// Each render mode has a corresponding content shape.

export interface ReadingWordData {
    word: string;
    lemma?: string;
    strongs?: string; // Strong's concordance reference
    morphology?: string;
    transliteration?: string;
}

export interface ReadingFootnote {
    index: number;
    marker: string;
    text: string;
}

export interface ReadingVerse {
    number: number;
    text: string;
    originalText?: string;
    transliteration?: string;
    wordData?: ReadingWordData[];
    footnoteIndices?: number[];
    crossRefIds?: string[];
}

export interface ReadingParagraph {
    index: number;
    text: string;
    isHeading?: boolean;
    headingLevel?: 1 | 2 | 3;
}

export interface StructuredTextContent {
    type: 'structured_text';
    verses?: ReadingVerse[];
    paragraphs?: ReadingParagraph[];
    footnotes?: ReadingFootnote[];
    rawHtml?: string; // sanitized fallback
}

export interface PdfPageContent {
    type: 'pdf_page';
    pageNumber: number;
    totalPages: number;
    textLayer?: string; // extracted text for search/copy/highlight
    imageUrl?: string; // pre-rendered page thumbnail
    pdfUrl?: string; // presigned URL of the full PDF for react-pdf rendering
    width: number;
    height: number;
}

export interface EpubChunkContent {
    type: 'epub_chunk';
    cfiStart: string;
    cfiEnd?: string;
    html: string; // sanitized EPUB chunk HTML
}

// Rendering is delegated to an external provider iframe.
// Only the sandbox URL is passed; no raw content is extracted.
export interface ProviderEmbedContent {
    type: 'provider_embed';
    embedUrl: string;
    sandboxPolicy: string; // e.g. 'allow-scripts allow-same-origin'
}

export type ReadingContent =
    | StructuredTextContent
    | PdfPageContent
    | EpubChunkContent
    | ProviderEmbedContent;
