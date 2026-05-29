import {
    File,
    FileText,
    FileCode,
    FileType,
    Image,
    Video,
    Music,
    Table2,
    Braces,
    Code2,
    Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

const SPREADSHEET_TYPES = new Set([
    'text/csv',
    'text/tab-separated-values',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function getFileIcon(mimeType: string): LucideIcon {
    if (!mimeType) return File;

    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;

    if (mimeType === 'application/pdf') return FileText;
    if (SPREADSHEET_TYPES.has(mimeType)) return Table2;
    if (mimeType === 'application/json') return Braces;
    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown')
        return FileCode;
    if (ARCHIVE_TYPES.has(mimeType)) return Archive;
    if (CODE_TYPES.has(mimeType)) return Code2;
    if (mimeType.startsWith('text/')) return FileType;

    return File;
}
