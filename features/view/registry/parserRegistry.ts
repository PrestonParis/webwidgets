import type { ViewParserContract } from '@/features/view/types/view';
import { parseTextLikeFile } from '@/features/view/parsers/textParser';
import { parseCsvFile } from '@/features/view/parsers/csvParser';
import { parseJsonFile } from '@/features/view/parsers/jsonParser';
import { parseImageFile } from '@/features/view/parsers/imageParser';
import { parsePdfFile } from '@/features/view/parsers/pdfParser';

export const VIEW_PARSERS: ViewParserContract[] = [
    {
        id: 'pdf',
        label: 'PDF Parser',
        mimeTypes: ['application/pdf'],
        parse: parsePdfFile,
    },
    {
        id: 'text-like',
        label: 'Text / Markdown / Code Parser',
        mimeTypes: [
            'text/plain',
            'text/markdown',
            'text/x-markdown',
            'text/typescript',
            'text/javascript',
            'text/x-python',
            'text/x-go',
            'text/html',
            'text/css',
            'application/javascript',
            'application/yaml',
            'text/yaml',
            'text/x-yaml',
        ],
        parse: parseTextLikeFile,
    },
    {
        id: 'csv',
        label: 'CSV Parser',
        mimeTypes: ['text/csv'],
        parse: parseCsvFile,
    },
    {
        id: 'json',
        label: 'JSON Parser',
        mimeTypes: ['application/json'],
        parse: parseJsonFile,
    },
    {
        id: 'image',
        label: 'Image Parser',
        mimeTypes: [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
            'image/svg+xml',
        ],
        parse: parseImageFile,
    },
];

export function getParserForMime(mimeType: string) {
    return (
        VIEW_PARSERS.find((parser) => parser.mimeTypes.includes(mimeType)) ??
        VIEW_PARSERS.find(
            (parser) => mimeType.startsWith('image/') && parser.id === 'image',
        ) ??
        null
    );
}
