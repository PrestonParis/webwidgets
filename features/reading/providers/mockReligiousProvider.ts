// Mock provider demonstrating the religious text provider interface.
// In production, swap getContent() to call a Bible API (API.Bible, ESV API, etc.)

import type {
    ReadingProvider,
    ReadingProviderCapabilities,
    ReadingListOptions,
    ReadingContentRequest,
    ReadingContentResult,
    ReadingSearchRequest,
    ReadingSearchResult,
} from '@/features/reading/types/providers';
import type {
    ReadingDocument,
    ReadingVersion,
    ReadingStructure,
    ReadingBook,
    ReadingChapter,
} from '@/features/reading/types/document';
import type { ReadingPosition } from '@/features/reading/types/positions';
import type { ReadingCitation } from '@/features/reading/types/annotations';
import type { StructuredTextContent } from '@/features/reading/types/content';
import { buildCitation } from '@/features/reading/lib/citationUtils';

const CAPABILITIES: ReadingProviderCapabilities = {
    fullText: true,
    search: true,
    versionComparison: true,
    crossReferences: true,
    pdfRendering: false,
    epubLocations: false,
    offlineCaching: false,
    highlights: true,
    notes: true,
    bookmarks: true,
    providerEmbed: false,
    aiSummarizationAllowed: true,
    exportAllowed: false,
    renderModes: ['structured_text', 'parallel_compare', 'study_mode'],
};

const BIBLE_DOC: ReadingDocument = {
    id: 'mock-bible',
    providerId: 'mock-religious',
    title: 'Holy Bible',
    type: 'religious_text',
    language: 'en',
    originalLanguage: 'hebrew-greek',
    source: {
        id: 'mock-bible-src',
        type: 'inline',
        requiresAuth: false,
        cacheable: true,
    },
    metadata: { tradition: 'christian' },
    permissions: ['read', 'highlight', 'annotate', 'search', 'ai_summarize'],
    defaultRenderMode: 'structured_text',
    supportedRenderModes: ['structured_text', 'parallel_compare', 'study_mode'],
};

const QURAN_DOC: ReadingDocument = {
    id: 'mock-quran',
    providerId: 'mock-religious',
    title: 'The Quran',
    type: 'religious_text',
    language: 'en',
    originalLanguage: 'arabic',
    source: {
        id: 'mock-quran-src',
        type: 'inline',
        requiresAuth: false,
        cacheable: true,
    },
    metadata: { tradition: 'islamic' },
    permissions: ['read', 'highlight', 'annotate', 'search', 'ai_summarize'],
    defaultRenderMode: 'structured_text',
    supportedRenderModes: ['structured_text', 'parallel_compare', 'study_mode'],
};

const VERSIONS: ReadingVersion[] = [
    {
        id: 'esv',
        documentId: 'mock-bible',
        name: 'English Standard Version',
        abbreviation: 'ESV',
        language: 'en',
        tradition: 'christian',
        year: 2001,
        isDefault: true,
    },
    {
        id: 'kjv',
        documentId: 'mock-bible',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'en',
        tradition: 'christian',
        year: 1611,
    },
    {
        id: 'niv',
        documentId: 'mock-bible',
        name: 'New International Version',
        abbreviation: 'NIV',
        language: 'en',
        tradition: 'christian',
        year: 1978,
    },
    {
        id: 'si',
        documentId: 'mock-quran',
        name: 'Sahih International',
        abbreviation: 'SI',
        language: 'en',
        tradition: 'islamic',
        isDefault: true,
    },
];

const GENESIS_BOOKS: ReadingBook[] = [
    {
        id: 'gen',
        documentId: 'mock-bible',
        name: 'Genesis',
        shortName: 'Gen',
        canonicalOrder: 1,
        totalChapters: 50,
        testament: 'old',
        division: 'Torah',
    },
    {
        id: 'john',
        documentId: 'mock-bible',
        name: 'John',
        shortName: 'Jn',
        canonicalOrder: 43,
        totalChapters: 21,
        testament: 'new',
        division: 'Gospels',
    },
    {
        id: 'rom',
        documentId: 'mock-bible',
        name: 'Romans',
        shortName: 'Rom',
        canonicalOrder: 45,
        totalChapters: 16,
        testament: 'new',
        division: 'Epistles',
    },
];

const MOCK_VERSE_DATA: Record<
    string,
    Array<{ number: number; text: string }>
> = {
    'Genesis.1': [
        {
            number: 1,
            text: 'In the beginning, God created the heavens and the earth.',
        },
        {
            number: 2,
            text: 'The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.',
        },
        {
            number: 3,
            text: 'And God said, "Let there be light," and there was light.',
        },
    ],
    'John.3': [
        {
            number: 14,
            text: 'And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up,',
        },
        {
            number: 15,
            text: 'that whoever believes in him may have eternal life.',
        },
        {
            number: 16,
            text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
        },
        {
            number: 17,
            text: 'For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.',
        },
    ],
};

function getMockVerses(
    book: string,
    chapter: number,
): Array<{ number: number; text: string }> {
    return (
        MOCK_VERSE_DATA[`${book}.${chapter}`] ?? [
            {
                number: 1,
                text: `[Mock content for ${book} ${chapter}:1 — connect a real Bible API for full text.]`,
            },
        ]
    );
}

const mockReligiousProvider: ReadingProvider = {
    id: 'mock-religious',
    name: 'Scripture Library',
    description: 'Religious texts including Bible and Quran',
    capabilities: CAPABILITIES,

    async listDocuments(
        options?: ReadingListOptions,
    ): Promise<ReadingDocument[]> {
        const docs = [BIBLE_DOC, QURAN_DOC];
        if (options?.search) {
            const q = options.search.toLowerCase();
            return docs.filter((d) => d.title.toLowerCase().includes(q));
        }
        return docs;
    },

    async getDocument(documentId: string): Promise<ReadingDocument> {
        if (documentId === 'mock-bible') return BIBLE_DOC;
        if (documentId === 'mock-quran') return QURAN_DOC;
        throw new Error(`Document not found: ${documentId}`);
    },

    async getVersions(documentId: string): Promise<ReadingVersion[]> {
        return VERSIONS.filter((v) => v.documentId === documentId);
    },

    async getStructure(documentId: string): Promise<ReadingStructure> {
        const books = GENESIS_BOOKS.filter((b) => b.documentId === documentId);
        const chapters: ReadingChapter[] = books.flatMap((b) =>
            Array.from({ length: Math.min(b.totalChapters, 3) }, (_, i) => ({
                id: `${b.id}-ch${i + 1}`,
                documentId,
                bookId: b.id,
                chapterNumber: i + 1,
                totalVerses: i === 0 ? 31 : 25,
            })),
        );
        return {
            documentId,
            books,
            chapters,
            hasVerses: true,
            hasPages: false,
            hasEpubLocations: false,
        };
    },

    async getContent(
        request: ReadingContentRequest,
    ): Promise<ReadingContentResult> {
        const { documentId, position } = request;
        if (position.type !== 'canonical')
            throw new Error('Canonical position required');
        const verses = getMockVerses(position.book, position.chapter);
        const content: StructuredTextContent = {
            type: 'structured_text',
            verses,
        };
        const nextPos: ReadingPosition = {
            type: 'canonical',
            book: position.book,
            chapter: position.chapter + 1,
        };
        const prevPos: ReadingPosition =
            position.chapter > 1
                ? {
                      type: 'canonical',
                      book: position.book,
                      chapter: position.chapter - 1,
                  }
                : position;
        return {
            documentId,
            position,
            content,
            nextPosition: nextPos,
            previousPosition: prevPos,
        };
    },

    async search(request: ReadingSearchRequest): Promise<ReadingSearchResult> {
        const q = request.query.toLowerCase();
        const hits = Object.entries(MOCK_VERSE_DATA).flatMap(
            ([key, verses]) => {
                const [book, chapterStr] = key.split('.');
                const chapter = parseInt(chapterStr ?? '1', 10);
                return verses
                    .filter((v) => v.text.toLowerCase().includes(q))
                    .map((v) => ({
                        position: {
                            type: 'canonical' as const,
                            book: book ?? '',
                            chapter,
                            verse: v.number,
                        },
                        preview: v.text.slice(0, 120),
                        reference: `${book ?? ''} ${chapter}:${v.number}`,
                    }));
            },
        );
        return { query: request.query, results: hits, totalCount: hits.length };
    },

    async getCitation(
        position: ReadingPosition,
        versionId?: string,
    ): Promise<ReadingCitation> {
        if (position.type !== 'canonical')
            throw new Error('Canonical position required');
        const verses = getMockVerses(position.book, position.chapter);
        const verse =
            position.verse !== undefined
                ? verses.find((v) => v.number === position.verse)
                : verses[0];
        const text = verse?.text ?? '';
        const version = versionId
            ? VERSIONS.find((v) => v.id === versionId)
            : VERSIONS.find((v) => v.isDefault);
        return buildCitation(text, position, BIBLE_DOC, version);
    },

    async resolveReference(ref: string): Promise<ReadingPosition | null> {
        const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
        if (!match) return null;
        const [, book, chapterStr, verseStr] = match;
        if (!book || !chapterStr) return null;
        const pos: ReadingPosition = {
            type: 'canonical',
            book: book.trim(),
            chapter: parseInt(chapterStr, 10),
        };
        if (verseStr && pos.type === 'canonical')
            (pos as { verse?: number }).verse = parseInt(verseStr, 10);
        return pos;
    },
};

export default mockReligiousProvider;
