import sanitizeHtml from 'sanitize-html';
import { err, ok, type Result } from 'neverthrow';
import type { ViewFileRef } from '@/features/view/schemas/objectSchemas';

const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024;
const BLOCKED_MIME_TYPES = [
    'application/x-msdownload',
    'application/x-sh',
    'application/octet-stream',
];

export type ViewSecurityError = {
    field: string;
    message: string;
};

export function validateViewFile(
    file: ViewFileRef,
): Result<ViewFileRef, ViewSecurityError[]> {
    const issues: ViewSecurityError[] = [];
    if (file.sizeBytes > MAX_PAYLOAD_BYTES)
        issues.push({
            field: 'sizeBytes',
            message: 'File exceeds View Widget iteration-1 size limit.',
        });
    if (BLOCKED_MIME_TYPES.includes(file.mimeType))
        issues.push({
            field: 'mimeType',
            message: 'This file type is blocked from direct rendering.',
        });
    if (file.url) {
        const parsed = new URL(file.url);
        if (!['https:', 'blob:', 'data:'].includes(parsed.protocol))
            issues.push({
                field: 'url',
                message: 'View URLs must use a safe protocol.',
            });
    }
    return issues.length > 0 ? err(issues) : ok(file);
}

export function sanitizeRichText(input: string) {
    return sanitizeHtml(input, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img',
            'h1',
            'h2',
            'h3',
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'title'],
            a: ['href', 'name', 'target', 'rel'],
        },
        allowedSchemes: ['https', 'mailto', 'data'],
    });
}

export function sanitizeSvg(input: string) {
    return sanitizeHtml(input, {
        allowedTags: [
            'svg',
            'g',
            'path',
            'rect',
            'circle',
            'ellipse',
            'line',
            'polyline',
            'polygon',
            'text',
            'defs',
            'linearGradient',
            'stop',
        ],
        allowedAttributes: {
            '*': [
                'id',
                'class',
                'fill',
                'stroke',
                'stroke-width',
                'd',
                'x',
                'y',
                'x1',
                'x2',
                'y1',
                'y2',
                'width',
                'height',
                'viewBox',
                'points',
                'cx',
                'cy',
                'r',
                'rx',
                'ry',
                'transform',
                'opacity',
                'offset',
                'stop-color',
            ],
        },
        allowedSchemes: [],
    });
}
