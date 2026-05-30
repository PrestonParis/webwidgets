import {
    findSupportedConversion,
    normalizeExtension,
} from '@webwidgets/conversion-shared';
import type { CreateConversionJobRequest } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { HttpError } from './errors.js';

// Allowed MIME type prefixes. Clients may send application/octet-stream as a
// generic fallback; the worker identifies the real format by file extension.
const ALLOWED_MIME_PREFIXES = [
    'text/',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-',
    'application/vnd.oasis.opendocument',
    'application/pdf',
    'application/epub+zip',
    'application/zip',
    'application/x-zip-compressed',
    'application/xhtml+xml',
    'application/csv',
    'application/octet-stream',
    'application/msword',
    'application/rtf',
    'text/rtf',
    'image/',
];

// Executable and script extensions that must never appear in any position within
// a filename, including double-extension attacks (e.g. malware.exe.docx).
const DANGEROUS_EXTENSIONS = new Set([
    'exe',
    'bat',
    'cmd',
    'sh',
    'bash',
    'ps1',
    'vbs',
    'vbe',
    'wsf',
    'hta',
    'dll',
    'so',
    'dylib',
    'msi',
    'scr',
    'pif',
    'com',
    'reg',
]);

function isMimeAllowed(mime: string): boolean {
    const normalised = mime.toLowerCase().split(';')[0]!.trim();
    return ALLOWED_MIME_PREFIXES.some((prefix) =>
        normalised.startsWith(prefix),
    );
}

function hasDoubleExtension(filename: string): boolean {
    const parts = filename.split('.');
    return parts.length >= 3;
}

function hasDangerousExtension(filename: string): boolean {
    return filename
        .split('.')
        .slice(1)
        .some((part) => DANGEROUS_EXTENSIONS.has(part.toLowerCase()));
}

export function assertJobAllowed(request: CreateConversionJobRequest) {
    if (request.fileSizeBytes > env.CONVERSION_MAX_FILE_BYTES) {
        throw new HttpError(
            'File is larger than the configured conversion limit.',
            413,
        );
    }

    if (!isMimeAllowed(request.sourceMime)) {
        throw new HttpError('Unsupported source MIME type.', 400);
    }

    const supported = findSupportedConversion(
        request.sourceExtension,
        request.targetExtension,
    );
    if (!supported) {
        throw new HttpError('Unsupported conversion route.', 400);
    }

    const filenameExtension = normalizeExtension(
        request.originalFileName.split('.').at(-1)?.toLowerCase() ?? '',
    );
    if (filenameExtension && filenameExtension !== request.sourceExtension) {
        throw new HttpError(
            'File extension does not match the requested source format.',
            400,
        );
    }

    if (hasDoubleExtension(request.originalFileName)) {
        throw new HttpError(
            'Filename contains a suspicious double extension.',
            400,
        );
    }

    if (hasDangerousExtension(request.originalFileName)) {
        throw new HttpError('Filename contains a dangerous extension.', 400);
    }
}
