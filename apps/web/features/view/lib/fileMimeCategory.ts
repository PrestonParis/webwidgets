export type MimeCategory =
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'data'
    | 'code'
    | 'archive'
    | 'other';

const ARCHIVE_TYPES = new Set([
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
    'application/x-bzip2',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
]);

const CODE_TYPES = new Set([
    'application/javascript',
    'application/typescript',
    'application/x-typescript',
    'text/javascript',
    'text/typescript',
    'text/x-python',
    'text/x-java-source',
    'text/x-csrc',
    'text/x-c++src',
    'text/x-go',
    'text/x-rust',
    'application/x-sh',
    'text/x-shellscript',
]);

const DATA_TYPES = new Set([
    'text/csv',
    'application/json',
    'text/tab-separated-values',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/xml',
    'text/xml',
    'text/yaml',
    'application/x-yaml',
]);

const DOCUMENT_TYPES = new Set([
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export function getMimeCategory(mimeType: string): MimeCategory {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    if (ARCHIVE_TYPES.has(mimeType)) return 'archive';
    if (CODE_TYPES.has(mimeType)) return 'code';
    if (DATA_TYPES.has(mimeType)) return 'data';
    if (DOCUMENT_TYPES.has(mimeType)) return 'document';

    if (mimeType.startsWith('text/')) return 'document';

    return 'other';
}
