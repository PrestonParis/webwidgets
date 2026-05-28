import type {
    FileConversionCapability,
    FileConversionFormat,
} from '@/features/files/conversion/types';
import {
    fileConversionFormats,
    fileConversionFormatOrder,
} from './conversionFormats';
import {
    availableTextAdapters,
    hostedUniversalAdapters,
    officeAdapters,
    pdfAdapters,
    imageAdapters,
} from './conversionProviders';

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

function isOfficeFormat(format: FileConversionFormat) {
    return ['doc', 'docx', 'rtf', 'odt', 'xlsx', 'xls', 'pptx', 'ppt'].includes(
        format,
    );
}

function isImageFormat(format: FileConversionFormat) {
    return ['png', 'jpg', 'webp', 'svg', 'tiff', 'gif'].includes(format);
}

function getAdaptersForRoute(
    from: FileConversionFormat,
    to: FileConversionFormat,
): FileConversionAdapter[] {
    if (from === 'unknown') return hostedUniversalAdapters;
    if (to === 'pdf' || from === 'pdf') return pdfAdapters;
    if (isOfficeFormat(from) || isOfficeFormat(to)) return officeAdapters;
    if (isImageFormat(from) || isImageFormat(to)) return imageAdapters;
    if (from === 'md' || to === 'md' || from === 'html' || to === 'html')
        return ['pandoc', ...hostedUniversalAdapters];
    if (from === 'csv' || to === 'csv' || from === 'json' || to === 'json')
        return ['cloudmersive', ...hostedUniversalAdapters];
    return hostedUniversalAdapters;
}

function buildAdapterNeededCapabilities(): FileConversionCapability[] {
    const existing = new Set(
        availableCapabilities.map((c) => `${c.from}:${c.to}`),
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

export const fileConversionCapabilities: FileConversionCapability[] = [
    ...availableCapabilities,
    ...buildAdapterNeededCapabilities(),
];

export function getFileConversionCapability(
    from: FileConversionFormat,
    to: FileConversionFormat,
) {
    return fileConversionCapabilities.find(
        (c) => c.from === from && c.to === to,
    );
}

export function getFileConversionTargets(from: FileConversionFormat) {
    return fileConversionCapabilities.filter((c) => c.from === from);
}

export function getPreferredTarget(from: FileConversionFormat) {
    return (
        preferredTargets[from]?.find((to) =>
            getFileConversionCapability(from, to),
        ) ??
        getFileConversionTargets(from)[0]?.to ??
        'pdf'
    );
}
