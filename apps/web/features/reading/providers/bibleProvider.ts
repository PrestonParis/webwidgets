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
    ReadingStructure,
    ReadingBook,
    ReadingVersion,
} from '@/features/reading/types/document';
import type { StructuredTextContent } from '@/features/reading/types/content';
import type { CanonicalPosition } from '@/features/reading/types/positions';

// ─── helpers ─────────────────────────────────────────────────────────────────

function bibleIdFromDocId(documentId: string): string {
    return documentId.startsWith('bible:') ? documentId.slice(6) : documentId;
}

async function apiBible<T>(path: string, params?: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams({ path, ...params });
    const res = await fetch(`/api/bible?${qs.toString()}`);
    if (!res.ok) throw new Error(`Bible API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
}

// ─── caches ───────────────────────────────────────────────────────────────────

// documentId → Map<bookName, apiBookId>
const bookIdCache = new Map<string, Map<string, string>>();
// documentId → Map<apiBookId, bookName>  (reverse lookup for search)
const bookNameCache = new Map<string, Map<string, string>>();
// documentId → Map<bookName, totalChapters>
const chapterCountCache = new Map<string, Map<string, number>>();
// In-flight structure fetches — deduplicates concurrent calls
const structurePromises = new Map<string, Promise<ReadingStructure>>();

// ─── API shapes ───────────────────────────────────────────────────────────────

interface ApiBible {
    id: string;
    name: string;
    nameLocal?: string;
    description?: string;
    descriptionLocal?: string;
    abbreviation?: string;
    abbreviationLocal?: string;
    language: { id: string; name: string; nameLocal: string; script: string; scriptDirection: string };
    countries?: { id: string; name: string }[];
    type?: string;
}

interface ApiBook {
    id: string;
    bibleId: string;
    name: string;
    nameLong?: string;
    abbreviation?: string;
    chapters?: { id: string; number: string; bookId: string; bibleId: string }[];
}

interface ApiChapter {
    id: string;
    bibleId: string;
    bookId: string;
    number: string;
    content: string;
    verseCount?: number;
    reference?: string;
}

interface ApiSearchResult {
    query: string;
    total: number;
    verses: Array<{
        id: string;
        bibleId: string;
        bookId: string;
        chapterId: string;
        reference: string;
        text: string;
    }>;
}

// ─── mapping ─────────────────────────────────────────────────────────────────

function mapBibleToDocument(bible: ApiBible): ReadingDocument {
    return {
        id: `bible:${bible.id}`,
        providerId: 'api-bible',
        externalId: bible.id,
        title: bible.nameLocal ?? bible.name,
        description: bible.descriptionLocal ?? bible.description,
        type: 'religious_text',
        language: bible.language?.id ?? 'en',
        source: {
            id: bible.id,
            type: 'api',
            apiEndpoint: 'https://api.scripture.api.bible/v1',
            requiresAuth: false,
            cacheable: true,
        },
        metadata: {
            tradition: 'christian',
            tags: [bible.abbreviationLocal ?? bible.abbreviation ?? ''],
        },
        permissions: ['read', 'search', 'highlight', 'annotate', 'bookmarks'],
        defaultRenderMode: 'structured_text',
        supportedRenderModes: ['structured_text'],
    };
}

function mapBooksToStructure(documentId: string, books: ApiBook[]): ReadingStructure {
    const idMap = new Map<string, string>();
    const reverseMap = new Map<string, string>();
    const chapterMap = new Map<string, number>();

    for (const b of books) {
        idMap.set(b.name, b.id);
        reverseMap.set(b.id, b.name);
        chapterMap.set(b.name, b.chapters?.length ?? 0);
    }

    bookIdCache.set(documentId, idMap);
    bookNameCache.set(documentId, reverseMap);
    chapterCountCache.set(documentId, chapterMap);

    const readingBooks: ReadingBook[] = books.map((b, i) => ({
        id: b.id,
        documentId,
        name: b.name,
        shortName: b.abbreviation,
        canonicalOrder: i,
        totalChapters: b.chapters?.length ?? 0,
    }));

    return {
        documentId,
        books: readingBooks,
        hasVerses: true,
        hasPages: false,
        hasEpubLocations: false,
    };
}

// ─── capabilities ─────────────────────────────────────────────────────────────

const CAPABILITIES: ReadingProviderCapabilities = {
    fullText: true,
    search: true,
    versionComparison: false,
    crossReferences: false,
    pdfRendering: false,
    epubLocations: false,
    offlineCaching: false,
    highlights: true,
    notes: true,
    bookmarks: true,
    providerEmbed: false,
    aiSummarizationAllowed: true,
    exportAllowed: false,
    renderModes: ['structured_text'],
};

// ─── provider ─────────────────────────────────────────────────────────────────

const bibleProvider: ReadingProvider = {
    id: 'api-bible',
    name: 'Bible (API.Bible)',
    description: 'Bible translations from scripture.api.bible',
    capabilities: CAPABILITIES,

    async listDocuments(options?: ReadingListOptions): Promise<ReadingDocument[]> {
        const params: Record<string, string> = {};
        if (options?.language) params.language = options.language;

        const data = await apiBible<{ data: ApiBible[] }>('/bibles', params);
        let docs = data.data.map(mapBibleToDocument);

        if (options?.search) {
            const q = options.search.toLowerCase();
            docs = docs.filter(
                (d) =>
                    d.title.toLowerCase().includes(q) ||
                    (d.description ?? '').toLowerCase().includes(q),
            );
        }
        if (options?.limit) docs = docs.slice(0, options.limit);
        return docs;
    },

    async getDocument(documentId: string): Promise<ReadingDocument> {
        const bibleId = bibleIdFromDocId(documentId);
        const data = await apiBible<{ data: ApiBible }>(`/bibles/${bibleId}`);
        return mapBibleToDocument(data.data);
    },

    async getVersions(_documentId: string): Promise<ReadingVersion[]> {
        return [];
    },

    async getStructure(documentId: string): Promise<ReadingStructure> {
        // Deduplicate concurrent calls for the same document
        const inflight = structurePromises.get(documentId);
        if (inflight) return inflight;

        const promise = (async () => {
            const bibleId = bibleIdFromDocId(documentId);
            const data = await apiBible<{ data: ApiBook[] }>(
                `/bibles/${bibleId}/books`,
                { 'include-chapters': 'true' },
            );
            return mapBooksToStructure(documentId, data.data);
        })();

        structurePromises.set(documentId, promise);
        try {
            return await promise;
        } finally {
            structurePromises.delete(documentId);
        }
    },

    async getContent(request: ReadingContentRequest): Promise<ReadingContentResult> {
        const { documentId, position } = request;
        if (position.type !== 'canonical') {
            throw new Error('Bible provider requires canonical position');
        }
        const pos = position as CanonicalPosition;
        const bibleId = bibleIdFromDocId(documentId);

        let bookMap = bookIdCache.get(documentId);
        if (!bookMap) {
            await bibleProvider.getStructure(documentId);
            bookMap = bookIdCache.get(documentId);
        }
        const bookApiId = bookMap?.get(pos.book);
        if (!bookApiId) throw new Error(`Book not found: ${pos.book}`);

        const chapterId = `${bookApiId}.${pos.chapter}`;
        const data = await apiBible<{ data: ApiChapter }>(
            `/bibles/${bibleId}/chapters/${chapterId}`,
            {
                'content-type': 'html',
                'include-verse-numbers': 'true',
                'include-titles': 'true',
                'include-chapter-numbers': 'false',
            },
        );

        const content: StructuredTextContent = {
            type: 'structured_text',
            rawHtml: data.data.content,
        };

        // Build prev/next positions
        const bookNames = bookMap ? [...bookMap.keys()] : [];
        const bookIndex = bookNames.indexOf(pos.book);
        const chapterCounts = chapterCountCache.get(documentId);

        const prevPos: CanonicalPosition | undefined =
            pos.chapter > 1
                ? { type: 'canonical', book: pos.book, chapter: pos.chapter - 1 }
                : bookIndex > 0
                  ? {
                        type: 'canonical',
                        book: bookNames[bookIndex - 1]!,
                        chapter: chapterCounts?.get(bookNames[bookIndex - 1]!) ?? 1,
                    }
                  : undefined;

        const nextPos: CanonicalPosition = {
            type: 'canonical',
            book: pos.book,
            chapter: pos.chapter + 1,
        };

        return {
            documentId,
            position,
            content,
            ...(prevPos && { previousPosition: prevPos }),
            nextPosition: nextPos,
        };
    },

    async search(request: ReadingSearchRequest): Promise<ReadingSearchResult> {
        const bibleId = bibleIdFromDocId(request.documentId);
        const data = await apiBible<{ data: ApiSearchResult }>(
            `/bibles/${bibleId}/search`,
            {
                query: request.query,
                limit: String(request.limit ?? 20),
                offset: String(request.offset ?? 0),
            },
        );

        const reverseMap = bookNameCache.get(request.documentId);

        return {
            query: request.query,
            totalCount: data.data.total,
            results: data.data.verses.map((v) => {
                // chapterId is "{bookId}.{chapterNumber}" e.g. "GEN.1"
                const chapterNum = parseInt(v.chapterId.split('.')[1] ?? '1', 10);
                const bookName = reverseMap?.get(v.bookId);

                const pos: CanonicalPosition | undefined =
                    bookName
                        ? { type: 'canonical', book: bookName, chapter: chapterNum }
                        : undefined;

                return {
                    position: pos ?? {
                        type: 'opaque' as const,
                        providerData: { verseId: v.id, chapterId: v.chapterId, bookId: v.bookId },
                    },
                    preview: v.text,
                    reference: v.reference,
                };
            }),
        };
    },
};

export default bibleProvider;
