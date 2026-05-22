export type {
    ReadingPosition,
    CanonicalPosition,
    PagePosition,
    EpubPosition,
    PercentPosition,
    OpaquePosition,
} from './positions';
export {
    isCanonicalPosition,
    isPagePosition,
    isEpubPosition,
    percentOf,
} from './positions';

export type {
    ReadingDocumentType,
    ReadingPermission,
    ReligiousTradition,
    ReadingRenderMode,
    ReadingSource,
    ReadingDocumentMetadata,
    ReadingDocument,
    ReadingVersion,
    ReadingBook,
    ReadingChapter,
    ReadingSection,
    ReadingStructure,
    ReadingCrossReference,
} from './document';

export type {
    ReadingWordData,
    ReadingFootnote,
    ReadingVerse,
    ReadingParagraph,
    StructuredTextContent,
    PdfPageContent,
    EpubChunkContent,
    ProviderEmbedContent,
    ReadingContent,
} from './content';

export type {
    BookmarkColor,
    HighlightColor,
    ReadingBookmark,
    ReadingHighlight,
    ReadingNote,
    ReadingCitation,
    BookmarkRow,
    HighlightRow,
    NoteRow,
} from './annotations';
export { rowToBookmark, rowToHighlight, rowToNote } from './annotations';

export type {
    ReadingPlanReading,
    ReadingPlanEntry,
    ReadingPlan,
    ReadingProgress,
    ReadingPreferences,
    ReadingPreferenceFontSize,
    ReadingPreferenceFontFamily,
    ReadingPreferenceTheme,
} from './plans';
export { DEFAULT_READING_PREFERENCES } from './plans';

export type {
    ReadingProviderCapabilities,
    ReadingListOptions,
    ReadingContentContext,
    ReadingContentRequest,
    ReadingContentResult,
    ReadingSearchRequest,
    ReadingSearchHit,
    ReadingSearchResult,
    ReadingProvider,
} from './providers';
