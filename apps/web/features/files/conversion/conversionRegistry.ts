import type {
    FileConversionAdapter,
    FileConversionCapability,
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

export const fileConversionProviders: Record<
    FileConversionAdapter,
    {
        label: string;
        notes: string;
        url?: string;
        billing: 'local' | 'free-tier' | 'paid-production';
    }
> = {
    'local-marked': {
        label: 'Local Markdown',
        notes: 'Built-in Markdown and sanitization path.',
        billing: 'local',
    },
    'local-text': {
        label: 'Local Text',
        notes: 'Built-in plain text and conservative HTML transforms.',
        billing: 'local',
    },
    pandoc: {
        label: 'Pandoc',
        notes: 'Local universal document converter adapter candidate.',
        url: 'https://pandoc.org/',
        billing: 'local',
    },
    libreoffice: {
        label: 'LibreOffice',
        notes: 'Local office document conversion adapter candidate.',
        url: 'https://www.libreoffice.org/',
        billing: 'local',
    },
    mammoth: {
        label: 'Mammoth',
        notes: 'Local DOCX to HTML/Markdown adapter candidate.',
        url: 'https://github.com/mwilliamson/mammoth.js',
        billing: 'local',
    },
    cloudconvert: {
        label: 'CloudConvert',
        notes: 'Hosted conversion API for documents, media, archives, and images.',
        url: 'https://cloudconvert.com/apis/file-conversion',
        billing: 'paid-production',
    },
    convertapi: {
        label: 'ConvertAPI',
        notes: 'Hosted conversion API with broad document and PDF routes.',
        url: 'https://www.convertapi.com/',
        billing: 'paid-production',
    },
    zamzar: {
        label: 'Zamzar',
        notes: 'Hosted conversion API with broad format coverage.',
        url: 'https://developers.zamzar.com/docs',
        billing: 'paid-production',
    },
    cloudmersive: {
        label: 'Cloudmersive',
        notes: 'Hosted document, PDF, image, and data conversion APIs.',
        url: 'https://api.cloudmersive.com/docs/convert.asp',
        billing: 'paid-production',
    },
    pdfco: {
        label: 'PDF.co',
        notes: 'Hosted PDF extraction, generation, and conversion APIs.',
        url: 'https://pdf.co/',
        billing: 'paid-production',
    },
    groupdocs: {
        label: 'GroupDocs Conversion Cloud',
        notes: 'Hosted conversion API for Office, PDF, OpenDocument, images, and more.',
        url: 'https://docs.groupdocs.cloud/conversion/overview/',
        billing: 'paid-production',
    },
    aspose: {
        label: 'Aspose',
        notes: 'Hosted and SDK-based document, HTML, PDF, and image conversion APIs.',
        url: 'https://www.aspose.com/',
        billing: 'paid-production',
    },
    'adobe-pdf-services': {
        label: 'Adobe PDF Services',
        notes: 'Hosted PDF creation, export, and extraction APIs.',
        url: 'https://developer.adobe.com/document-services/',
        billing: 'paid-production',
    },
    nutrient: {
        label: 'Nutrient',
        notes: 'Hosted document converter API for Office and PDF workflows.',
        url: 'https://www.nutrient.io/api/converter-api/',
        billing: 'paid-production',
    },
    pdfrest: {
        label: 'pdfRest',
        notes: 'Hosted PDF-focused conversion and document processing APIs.',
        url: 'https://pdfrest.com/',
        billing: 'paid-production',
    },
};

const availableTextAdapters: FileConversionAdapter[] = [
    'local-marked',
    'local-text',
];

const hostedUniversalAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'groupdocs',
    'aspose',
];

const officeAdapters: FileConversionAdapter[] = [
    'libreoffice',
    'pandoc',
    ...hostedUniversalAdapters,
    'cloudmersive',
    'nutrient',
];

const pdfAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'cloudmersive',
    'pdfco',
    'groupdocs',
    'aspose',
    'adobe-pdf-services',
    'nutrient',
    'pdfrest',
];

const imageAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'cloudmersive',
    'groupdocs',
    'aspose',
];

const availableCapabilities: FileConversionCapability[] = [
    {
        from: 'md',
        to: 'html',
        label: 'Markdown to HTML',
        status: 'available',
        adapters: ['local-marked', 'pandoc', 'cloudconvert', 'convertapi'],
        notes: 'Runs locally with the existing Markdown parser and sanitizer.',
    },
    {
        from: 'html',
        to: 'md',
        label: 'HTML to Markdown',
        status: 'available',
        adapters: ['local-text', 'pandoc', 'cloudconvert', 'zamzar'],
        notes: 'Runs locally with a conservative HTML-to-Markdown transform.',
    },
    {
        from: 'md',
        to: 'txt',
        label: 'Markdown to plain text',
        status: 'available',
        adapters: availableTextAdapters,
        notes: 'Runs locally by rendering Markdown and extracting readable text.',
    },
    {
        from: 'txt',
        to: 'md',
        label: 'Plain text to Markdown',
        status: 'available',
        adapters: ['local-text', 'pandoc'],
        notes: 'Runs locally by preserving paragraphs as Markdown text.',
    },
    {
        from: 'html',
        to: 'txt',
        label: 'HTML to plain text',
        status: 'available',
        adapters: ['local-text'],
        notes: 'Runs locally by stripping markup and decoding common entities.',
    },
    {
        from: 'txt',
        to: 'html',
        label: 'Plain text to HTML',
        status: 'available',
        adapters: ['local-text'],
        notes: 'Runs locally by escaping text and preserving line breaks.',
    },
];

const preferredTargets: Partial<
    Record<FileConversionFormat, FileConversionFormat[]>
> = {
    docx: ['pdf', 'md', 'html', 'txt', 'doc', 'rtf', 'odt'],
    doc: ['pdf', 'docx', 'md', 'html', 'txt', 'rtf', 'odt'],
    pdf: ['docx', 'md', 'txt', 'html', 'png', 'jpg'],
    md: ['pdf', 'docx', 'html', 'txt'],
    html: ['pdf', 'docx', 'md', 'txt'],
    txt: ['pdf', 'docx', 'md', 'html'],
    rtf: ['pdf', 'docx', 'md', 'txt'],
    odt: ['pdf', 'docx', 'md', 'txt'],
    epub: ['pdf', 'docx', 'md', 'html', 'txt'],
    csv: ['xlsx', 'json', 'pdf', 'txt'],
    json: ['csv', 'xml', 'txt'],
    xml: ['json', 'csv', 'txt'],
    xlsx: ['pdf', 'csv', 'xls', 'json'],
    xls: ['pdf', 'xlsx', 'csv'],
    pptx: ['pdf', 'ppt', 'png', 'jpg'],
    ppt: ['pdf', 'pptx', 'png', 'jpg'],
    png: ['jpg', 'webp', 'pdf', 'svg'],
    jpg: ['png', 'webp', 'pdf'],
    webp: ['png', 'jpg', 'pdf'],
    svg: ['png', 'jpg', 'pdf'],
    tiff: ['png', 'jpg', 'pdf'],
    gif: ['png', 'webp', 'pdf'],
    zip: ['pdf'],
    unknown: ['pdf'],
};

export const fileConversionCapabilities: FileConversionCapability[] = [
    ...availableCapabilities,
    ...buildAdapterNeededCapabilities(),
];

export function getFileConversionCapability(
    from: FileConversionFormat,
    to: FileConversionFormat,
) {
    return fileConversionCapabilities.find(
        (capability) => capability.from === from && capability.to === to,
    );
}

export function getFileConversionTargets(from: FileConversionFormat) {
    return fileConversionCapabilities.filter(
        (capability) => capability.from === from,
    );
}

export function getPreferredTarget(from: FileConversionFormat) {
    return (
        preferredTargets[from]?.find((to) =>
            getFileConversionCapability(from, to),
        ) ??
        getFileConversionTargets(from)[0]?.to ??
        defaultFileConversion.to
    );
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

export function isFileConversionFormat(
    value: string,
): value is FileConversionFormat {
    return value in fileConversionFormats;
}

function buildAdapterNeededCapabilities() {
    const existing = new Set(
        availableCapabilities.map(
            (capability) => `${capability.from}:${capability.to}`,
        ),
    );

    return fileConversionFormatOrder.flatMap((from) => {
        const targets = preferredTargets[from] ?? [];

        return targets.flatMap((to) => {
            if (from === to || existing.has(`${from}:${to}`)) return [];

            return [
                {
                    from,
                    to,
                    label: `${fileConversionFormats[from].label} to ${fileConversionFormats[to].label}`,
                    status: 'adapter-needed',
                    adapters: getAdaptersForRoute(from, to),
                    notes: 'This route is registered and needs a local adapter or hosted provider key before it can run.',
                } satisfies FileConversionCapability,
            ];
        });
    });
}

function getAdaptersForRoute(
    from: FileConversionFormat,
    to: FileConversionFormat,
): FileConversionAdapter[] {
    if (from === 'unknown') return hostedUniversalAdapters;
    if (to === 'pdf' || from === 'pdf') return pdfAdapters;
    if (isOfficeFormat(from) || isOfficeFormat(to)) return officeAdapters;
    if (isImageFormat(from) || isImageFormat(to)) return imageAdapters;
    if (from === 'md' || to === 'md' || from === 'html' || to === 'html') {
        return ['pandoc', ...hostedUniversalAdapters];
    }
    if (from === 'csv' || to === 'csv' || from === 'json' || to === 'json') {
        return ['cloudmersive', ...hostedUniversalAdapters];
    }
    return hostedUniversalAdapters;
}

function isOfficeFormat(format: FileConversionFormat) {
    return ['doc', 'docx', 'rtf', 'odt', 'xlsx', 'xls', 'pptx', 'ppt'].includes(
        format,
    );
}

function isImageFormat(format: FileConversionFormat) {
    return ['png', 'jpg', 'webp', 'svg', 'tiff', 'gif'].includes(format);
}
