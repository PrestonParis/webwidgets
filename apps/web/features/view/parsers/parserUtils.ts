import type {
    NormalizedViewDocument,
    ViewFileRef,
} from '@/features/view/schemas/objectSchemas';
import type {
    ViewFileCategory,
    ViewRenderStrategy,
} from '@/features/view/schemas/enumSchemas';

export function detectCategory(mimeType: string): ViewFileCategory {
    if (
        mimeType === 'application/pdf' ||
        mimeType.includes('word') ||
        mimeType.startsWith('text/markdown')
    )
        return 'document';
    if (mimeType.startsWith('image/')) return 'image';
    if (
        mimeType === 'text/csv' ||
        mimeType === 'application/json' ||
        mimeType.includes('yaml')
    )
        return 'data';
    if (mimeType.startsWith('text/') || mimeType.includes('javascript'))
        return 'code';
    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))
        return 'media';
    return 'unknown';
}

export function normalizedDocument(input: {
    file: ViewFileRef;
    strategy: ViewRenderStrategy;
    renderable: unknown;
    searchableText?: string;
    metadata?: Record<string, unknown>;
    analysisHints?: string[];
    sanitized?: boolean;
    isolated?: boolean;
    warnings?: string[];
}): NormalizedViewDocument {
    return {
        file: input.file,
        category: detectCategory(input.file.mimeType),
        strategy: input.strategy,
        metadata: input.metadata ?? {},
        searchableText: input.searchableText ?? '',
        renderable: input.renderable,
        analysisHints: input.analysisHints ?? [],
        security: {
            sanitized: input.sanitized ?? false,
            isolated: input.isolated ?? false,
            maxPayloadBytes: 25 * 1024 * 1024,
            warnings: input.warnings ?? [],
        },
    };
}

export function inferCodeLanguage(fileName: string, mimeType: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'js' || ext === 'jsx' || mimeType.includes('javascript'))
        return 'javascript';
    if (ext === 'py') return 'python';
    if (ext === 'go') return 'go';
    if (ext === 'html') return 'html';
    if (ext === 'css') return 'css';
    if (ext === 'json') return 'json';
    if (ext === 'yaml' || ext === 'yml') return 'yaml';
    return 'text';
}
