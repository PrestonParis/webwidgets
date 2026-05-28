import type {
    FileConversionFormat,
    FileConversionFormatMeta,
} from '@/features/files/conversion/types';

const anyMime = 'application/octet-stream';

export const fileConversionFormats: Record<
    FileConversionFormat,
    FileConversionFormatMeta
> = {
    doc: {
        id: 'doc',
        label: 'Word document (.doc)',
        extension: 'doc',
        mimeType: 'application/msword',
        accept: '.doc,application/msword',
    },
    docx: {
        id: 'docx',
        label: 'Word document (.docx)',
        extension: 'docx',
        mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    pdf: {
        id: 'pdf',
        label: 'PDF',
        extension: 'pdf',
        mimeType: 'application/pdf',
        accept: '.pdf,application/pdf',
    },
    md: {
        id: 'md',
        label: 'Markdown',
        extension: 'md',
        mimeType: 'text/markdown; charset=utf-8',
        accept: '.md,.markdown,text/markdown,text/plain',
    },
    html: {
        id: 'html',
        label: 'HTML',
        extension: 'html',
        mimeType: 'text/html; charset=utf-8',
        accept: '.html,.htm,text/html',
    },
    txt: {
        id: 'txt',
        label: 'Plain text',
        extension: 'txt',
        mimeType: 'text/plain; charset=utf-8',
        accept: '.txt,text/plain',
    },
    rtf: {
        id: 'rtf',
        label: 'Rich Text Format',
        extension: 'rtf',
        mimeType: 'application/rtf',
        accept: '.rtf,application/rtf,text/rtf',
    },
    odt: {
        id: 'odt',
        label: 'OpenDocument text',
        extension: 'odt',
        mimeType: 'application/vnd.oasis.opendocument.text',
        accept: '.odt,application/vnd.oasis.opendocument.text',
    },
    epub: {
        id: 'epub',
        label: 'EPUB',
        extension: 'epub',
        mimeType: 'application/epub+zip',
        accept: '.epub,application/epub+zip',
    },
    csv: {
        id: 'csv',
        label: 'CSV',
        extension: 'csv',
        mimeType: 'text/csv; charset=utf-8',
        accept: '.csv,text/csv',
    },
    json: {
        id: 'json',
        label: 'JSON',
        extension: 'json',
        mimeType: 'application/json; charset=utf-8',
        accept: '.json,application/json',
    },
    xml: {
        id: 'xml',
        label: 'XML',
        extension: 'xml',
        mimeType: 'application/xml; charset=utf-8',
        accept: '.xml,application/xml,text/xml',
    },
    xlsx: {
        id: 'xlsx',
        label: 'Excel workbook (.xlsx)',
        extension: 'xlsx',
        mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    xls: {
        id: 'xls',
        label: 'Excel workbook (.xls)',
        extension: 'xls',
        mimeType: 'application/vnd.ms-excel',
        accept: '.xls,application/vnd.ms-excel',
    },
    pptx: {
        id: 'pptx',
        label: 'PowerPoint (.pptx)',
        extension: 'pptx',
        mimeType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
    ppt: {
        id: 'ppt',
        label: 'PowerPoint (.ppt)',
        extension: 'ppt',
        mimeType: 'application/vnd.ms-powerpoint',
        accept: '.ppt,application/vnd.ms-powerpoint',
    },
    png: {
        id: 'png',
        label: 'PNG image',
        extension: 'png',
        mimeType: 'image/png',
        accept: '.png,image/png',
    },
    jpg: {
        id: 'jpg',
        label: 'JPEG image',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        accept: '.jpg,.jpeg,image/jpeg',
    },
    webp: {
        id: 'webp',
        label: 'WebP image',
        extension: 'webp',
        mimeType: 'image/webp',
        accept: '.webp,image/webp',
    },
    svg: {
        id: 'svg',
        label: 'SVG image',
        extension: 'svg',
        mimeType: 'image/svg+xml',
        accept: '.svg,image/svg+xml',
    },
    tiff: {
        id: 'tiff',
        label: 'TIFF image',
        extension: 'tiff',
        mimeType: 'image/tiff',
        accept: '.tif,.tiff,image/tiff',
    },
    gif: {
        id: 'gif',
        label: 'GIF image',
        extension: 'gif',
        mimeType: 'image/gif',
        accept: '.gif,image/gif',
    },
    zip: {
        id: 'zip',
        label: 'ZIP archive',
        extension: 'zip',
        mimeType: 'application/zip',
        accept: '.zip,application/zip',
    },
    unknown: {
        id: 'unknown',
        label: 'Other file type',
        extension: 'bin',
        mimeType: anyMime,
        accept: '*/*',
    },
};

export const defaultFileConversion = {
    from: 'docx',
    to: 'pdf',
} as const satisfies {
    from: FileConversionFormat;
    to: FileConversionFormat;
};

export const fileConversionFormatOrder: FileConversionFormat[] = [
    'docx',
    'pdf',
    'md',
    'html',
    'txt',
    'doc',
    'rtf',
    'odt',
    'epub',
    'csv',
    'json',
    'xml',
    'xlsx',
    'xls',
    'pptx',
    'ppt',
    'png',
    'jpg',
    'webp',
    'svg',
    'tiff',
    'gif',
    'zip',
    'unknown',
];

export function isFileConversionFormat(
    value: string,
): value is FileConversionFormat {
    return value in fileConversionFormats;
}

export function inferFileConversionFormat(file: File): FileConversionFormat {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension) {
        if (extension === 'jpeg') return 'jpg';
        if (extension === 'htm') return 'html';
        if (extension === 'markdown') return 'md';
        if (extension === 'tif') return 'tiff';
        if (isFileConversionFormat(extension)) return extension;
    }
    const mimeType = file.type.toLowerCase();
    const match = fileConversionFormatOrder.find((format) =>
        fileConversionFormats[format].accept
            .toLowerCase()
            .split(',')
            .includes(mimeType),
    );
    return match ?? 'unknown';
}
