import type { ViewParseInput } from '@/features/view/types/view';
import { sanitizeSvg } from '@/features/view/security/contentSecurity';
import { normalizedDocument } from '@/features/view/parsers/parserUtils';

export async function parseImageFile(input: ViewParseInput) {
    const isSvg = input.file.mimeType === 'image/svg+xml';
    const svg = isSvg ? sanitizeSvg(input.text ?? '') : undefined;

    return normalizedDocument({
        file: input.file,
        strategy: isSvg ? 'svg_sandbox' : 'image',
        searchableText: input.file.name,
        renderable: { url: input.file.url, svg, alt: input.file.name },
        metadata: {
            mimeType: input.file.mimeType,
            sizeBytes: input.file.sizeBytes,
        },
        analysisHints: [
            'visual-analysis-placeholder',
            'ocr-placeholder',
            'metadata-inspection',
        ],
        sanitized: isSvg,
        isolated: isSvg,
    });
}
