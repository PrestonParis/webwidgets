import type { ViewParseInput } from '@/features/view/types/view';
import { normalizedDocument } from '@/features/view/parsers/parserUtils';

export async function parsePdfFile(input: ViewParseInput) {
    return normalizedDocument({
        file: input.file,
        strategy: 'pdf_canvas',
        searchableText: input.text ?? '',
        renderable: {
            url: input.file.url,
            page: 1,
            textExtraction: 'pdfjs-placeholder',
        },
        metadata: {
            mimeType: 'application/pdf',
            sizeBytes: input.file.sizeBytes,
        },
        analysisHints: [
            'pdf-text-extraction',
            'document-structure',
            'annotation-overlay',
        ],
        sanitized: true,
        isolated: true,
    });
}
