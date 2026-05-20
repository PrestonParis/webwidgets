// Mock PDF provider demonstrating the PDF document interface.
// Real user PDFs are served by userUploadsProvider (S3 presigned URLs + react-pdf rendering).

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
import type { PagePosition } from '@/features/reading/types/positions';

const CAPABILITIES: ReadingProviderCapabilities = {
    fullText: false,
    search: false,
    versionComparison: false,
    crossReferences: false,
    pdfRendering: true,
    epubLocations: false,
    offlineCaching: true,
    highlights: true,
    notes: true,
    bookmarks: true,
    providerEmbed: false,
    aiSummarizationAllowed: true,
    exportAllowed: false,
    renderModes: ['pdf_canvas', 'image_pages'],
};

const SAMPLE_PDF: ReadingDocument = {
    id: 'mock-pdf-sample',
    providerId: 'mock-pdf',
    title: 'Mere Christianity',
    author: 'C.S. Lewis',
    description: 'Public domain broadcast talks on Christian belief.',
    type: 'pdf',
    language: 'en',
    source: {
        id: 'mock-pdf-src',
        type: 's3',
        s3Key: 'reading/samples/mere-christianity.pdf',
        requiresAuth: true,
        cacheable: true,
    },
    metadata: { tags: ['theology', 'apologetics', 'classic'] },
    permissions: ['read', 'highlight', 'annotate', 'search', 'ai_summarize'],
    defaultRenderMode: 'pdf_canvas',
    supportedRenderModes: ['pdf_canvas', 'image_pages'],
    totalPages: 227,
    estimatedReadTimeMinutes: 340,
};

function makeMockPage(page: number, totalPages: number): PdfPageContent {
    return {
        type: 'pdf_page',
        pageNumber: page,
        totalPages,
        textLayer: `[Sample PDF placeholder text for page ${page}. Uploaded PDFs render through react-pdf.]`,
        width: 612,
        height: 792,
    };
}

const mockPdfProvider: ReadingProvider = {
    id: 'mock-pdf',
    name: 'PDF Library',
    description: 'Uploaded PDFs and public-domain books',
    capabilities: CAPABILITIES,

    async listDocuments(
        options?: ReadingListOptions,
    ): Promise<ReadingDocument[]> {
        const docs = [SAMPLE_PDF];
        if (options?.search) {
            const q = options.search.toLowerCase();
            return docs.filter(
                (d) =>
                    d.title.toLowerCase().includes(q) ||
                    (d.author ?? '').toLowerCase().includes(q),
            );
        }
        return docs;
    },

    async getDocument(documentId: string): Promise<ReadingDocument> {
        if (documentId === SAMPLE_PDF.id) return SAMPLE_PDF;
        throw new Error(`PDF document not found: ${documentId}`);
    },

    async getStructure(documentId: string): Promise<ReadingStructure> {
        const doc = await this.getDocument(documentId);
        return {
            documentId,
            hasVerses: false,
            hasPages: true,
            hasEpubLocations: false,
            ...(doc.totalPages !== undefined && { totalPages: doc.totalPages }),
        };
    },

    async getContent(
        request: ReadingContentRequest,
    ): Promise<ReadingContentResult> {
        const { documentId, position } = request;
        if (position.type !== 'page')
            throw new Error('Page position required for PDF provider');
        const doc = await this.getDocument(documentId);
        const totalPages = doc.totalPages ?? 1;
        const page = Math.max(1, Math.min(position.page, totalPages));
        const content = makeMockPage(page, totalPages);
        const prev: PagePosition | undefined =
            page > 1 ? { type: 'page', page: page - 1 } : undefined;
        const next: PagePosition | undefined =
            page < totalPages ? { type: 'page', page: page + 1 } : undefined;
        return {
            documentId,
            position,
            content,
            ...(prev && { previousPosition: prev }),
            ...(next && { nextPosition: next }),
            totalPositions: totalPages,
        };
    },

    async search(request: ReadingSearchRequest): Promise<ReadingSearchResult> {
        const q = request.query.toLowerCase();
        const doc = SAMPLE_PDF;
        const totalPages = doc.totalPages ?? 1;
        const results: Array<{
            position: { type: 'page'; page: number };
            preview: string;
        }> = [];
        for (let page = 1; page <= totalPages; page++) {
            const { textLayer } = makeMockPage(page, totalPages);
            if (textLayer.toLowerCase().includes(q)) {
                results.push({
                    position: { type: 'page', page },
                    preview: textLayer.slice(0, 120),
                });
            }
        }
        return { query: request.query, results, totalCount: results.length };
    },
};

export default mockPdfProvider;
