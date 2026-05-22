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
} from '@/features/reading/types/document';
import type { PdfPageContent } from '@/features/reading/types/content';

const CAPABILITIES: ReadingProviderCapabilities = {
    fullText: false,
    search: false,
    versionComparison: false,
    crossReferences: false,
    pdfRendering: true,
    epubLocations: false,
    offlineCaching: false,
    highlights: true,
    notes: true,
    bookmarks: true,
    providerEmbed: false,
    aiSummarizationAllowed: false,
    exportAllowed: false,
    renderModes: ['pdf_canvas'],
};

function uploadToDocument(file: {
    id: string;
    originalName: string;
    sizeBytes: number;
}): ReadingDocument {
    return {
        id: `upload:${file.id}`,
        providerId: 'user-uploads',
        title: file.originalName.replace(/\.[^.]+$/, ''),
        type: 'pdf',
        language: 'en',
        source: {
            id: file.id,
            type: 's3',
            requiresAuth: true,
            cacheable: false,
        },
        metadata: {},
        permissions: ['read', 'highlight', 'annotate'],
        defaultRenderMode: 'pdf_canvas',
        supportedRenderModes: ['pdf_canvas'],
    };
}

function extractFileId(documentId: string): string {
    return documentId.startsWith('upload:') ? documentId.slice(7) : documentId;
}

const urlCache = new Map<string, { url: string; expiresAt: number }>();

async function fetchPdfUrl(fileId: string): Promise<string> {
    const cached = urlCache.get(fileId);
    if (cached && cached.expiresAt > Date.now()) return cached.url;

    const res = await fetch(
        `/api/reading/pdf-url?fileId=${encodeURIComponent(fileId)}`,
    );
    if (!res.ok) throw new Error(`Failed to get PDF URL: ${res.statusText}`);
    const data = (await res.json()) as { url: string };
    // Cache for 55 minutes (presigned URL expires in 60)
    urlCache.set(fileId, {
        url: data.url,
        expiresAt: Date.now() + 55 * 60 * 1000,
    });
    return data.url;
}

const userUploadsProvider: ReadingProvider = {
    id: 'user-uploads',
    name: 'My PDF Library',
    description: 'PDFs you have uploaded to your account',
    capabilities: CAPABILITIES,

    async listDocuments(
        options?: ReadingListOptions,
    ): Promise<ReadingDocument[]> {
        const res = await fetch('/api/uploads');
        if (!res.ok) return [];
        const data = (await res.json()) as {
            files: Array<{
                id: string;
                originalName: string;
                mimeType: string;
                sizeBytes: number;
            }>;
        };
        const pdfs = data.files.filter(
            (f) =>
                f.mimeType === 'application/pdf' ||
                f.originalName.endsWith('.pdf'),
        );
        const docs = pdfs.map(uploadToDocument);
        if (options?.search) {
            const q = options.search.toLowerCase();
            return docs.filter((d) => d.title.toLowerCase().includes(q));
        }
        return docs;
    },

    async getDocument(documentId: string): Promise<ReadingDocument> {
        const docs = await this.listDocuments();
        const doc = docs.find((d) => d.id === documentId);
        if (!doc) throw new Error(`PDF not found: ${documentId}`);
        return doc;
    },

    async getStructure(documentId: string): Promise<ReadingStructure> {
        return {
            documentId,
            hasVerses: false,
            hasPages: true,
            hasEpubLocations: false,
        };
    },

    async getContent(
        request: ReadingContentRequest,
    ): Promise<ReadingContentResult> {
        const { documentId, position } = request;
        if (position.type !== 'page')
            throw new Error('Page position required for PDF provider');
        const fileId = extractFileId(documentId);
        const pdfUrl = await fetchPdfUrl(fileId);
        const page = position.page;
        const content: PdfPageContent = {
            type: 'pdf_page',
            pageNumber: page,
            totalPages: 0,
            pdfUrl,
            width: 612,
            height: 792,
        };
        const prev =
            page > 1 ? { type: 'page' as const, page: page - 1 } : undefined;
        const next = { type: 'page' as const, page: page + 1 };
        return {
            documentId,
            position,
            content,
            ...(prev && { previousPosition: prev }),
            nextPosition: next,
        };
    },

    async search(_request: ReadingSearchRequest): Promise<ReadingSearchResult> {
        return { query: _request.query, results: [], totalCount: 0 };
    },
};

export default userUploadsProvider;
