export type ConversionKind = 'document' | 'image';

export type ConversionJobStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type ConversionExtension =
    | 'doc'
    | 'docx'
    | 'rtf'
    | 'ppt'
    | 'pptx'
    | 'xls'
    | 'xlsx'
    | 'ods'
    | 'odp'
    | 'odt'
    | 'html'
    | 'htm'
    | 'md'
    | 'markdown'
    | 'txt'
    | 'pdf'
    | 'csv'
    | 'tsv'
    | 'json'
    | 'rst'
    | 'epub'
    | 'png'
    | 'jpg'
    | 'jpeg'
    | 'webp'
    | 'gif'
    | 'tiff'
    | 'bmp'
    | 'svg';

export interface SupportedConversion {
    kind: ConversionKind;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    label: string;
    worker: 'worker-docs' | 'worker-images';
    workerFamily?: 'documents' | 'images';
    engine?:
        | 'libreoffice'
        | 'libreoffice-pdf'
        | 'pandoc'
        | 'native'
        | 'native-data'
        | 'pdftotext'
        | 'pdftohtml'
        | 'pdftoepub'
        | 'pdftoppm-png'
        | 'pdftoppm-jpg';
    lossy?: boolean;
    notes?: string;
    warnings?: string[];
}

export interface CreateConversionJobRequest {
    originalFileName: string;
    sourceMime: string;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    fileSizeBytes: number;
    userId?: string;
}

export interface CreateConversionJobResponse {
    jobId: string;
    inputObjectKey: string;
    uploadUrl?: string;
    uploadMethod: 'PUT' | 'POST';
    statusUrl: string;
}

export interface ConversionJob {
    id: string;
    status: ConversionJobStatus;
    kind: ConversionKind;
    originalFileName: string;
    sourceMime: string;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    fileSizeBytes: number;
    userId?: string;
    inputObjectKey: string;
    outputObjectKey?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DownloadUrlResponse {
    downloadUrl: string;
}

const pandocPdfWarning =
    'PDF output through Pandoc may require a local LaTeX PDF engine such as pdflatex, lualatex, or xelatex.';
const htmlSafetyWarning =
    'TODO: HTML input is not actively sanitized before conversion; scripts are not executed by Pandoc, but untrusted HTML needs a sanitizer pass.';

function docRoute(
    sourceExtension: ConversionExtension,
    targetExtension: ConversionExtension,
    engine: 'libreoffice' | 'pandoc' | 'native',
    options: Pick<SupportedConversion, 'lossy' | 'notes' | 'warnings'> = {},
): SupportedConversion {
    return {
        kind: 'document',
        sourceExtension,
        targetExtension,
        label: `${sourceExtension.toUpperCase()} to ${targetExtension.toUpperCase()}`,
        worker: 'worker-docs',
        workerFamily: 'documents',
        engine,
        lossy: options.lossy ?? targetExtension === 'pdf',
        ...options,
    };
}

export const supportedConversionMatrix: SupportedConversion[] = [
    docRoute('doc', 'pdf', 'libreoffice', {
        notes: 'Legacy Word layout fidelity is best-effort.',
    }),
    docRoute('docx', 'pdf', 'libreoffice', {
        notes: 'Office layout fidelity is best-effort.',
    }),
    docRoute('odt', 'pdf', 'libreoffice', {
        notes: 'OpenDocument layout fidelity is best-effort.',
    }),
    docRoute('rtf', 'pdf', 'libreoffice', {
        notes: 'RTF layout fidelity is best-effort.',
    }),
    docRoute('txt', 'pdf', 'pandoc', { warnings: [pandocPdfWarning] }),
    docRoute('html', 'pdf', 'pandoc', {
        warnings: [pandocPdfWarning, htmlSafetyWarning],
    }),
    docRoute('md', 'pdf', 'pandoc', { warnings: [pandocPdfWarning] }),
    docRoute('md', 'html', 'pandoc', { lossy: false }),
    docRoute('html', 'md', 'pandoc', {
        lossy: true,
        warnings: [htmlSafetyWarning],
    }),
    docRoute('txt', 'md', 'native', {
        lossy: false,
        notes: 'Plain text is valid Markdown; content is preserved unchanged.',
    }),
    docRoute('md', 'txt', 'pandoc', { lossy: true }),
    docRoute('ppt', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),
    docRoute('pptx', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),
    docRoute('odp', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),
    docRoute('xls', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    docRoute('xlsx', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    docRoute('ods', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    docRoute('csv', 'xlsx', 'libreoffice', { lossy: false }),
    docRoute('csv', 'pdf', 'libreoffice', {
        notes: 'CSV is rendered as a spreadsheet before PDF export.',
    }),
    docRoute('xlsx', 'csv', 'libreoffice', {
        lossy: true,
        notes: 'Exports the first sheet only.',
        warnings: [
            'XLSX to CSV exports the first sheet only. TODO: add multi-sheet export packaging.',
        ],
    }),
    docRoute('epub', 'pdf', 'pandoc', {
        lossy: true,
        notes: 'EPUB to PDF is best-effort when Pandoc can parse the EPUB cleanly.',
        warnings: [pandocPdfWarning, 'EPUB to PDF may be lossy.'],
    }),
    docRoute('epub', 'html', 'pandoc', {
        lossy: true,
        notes: 'EPUB chapters are flattened into a single HTML document.',
    }),
    docRoute('html', 'epub', 'pandoc', {
        lossy: false,
        warnings: [htmlSafetyWarning],
    }),
    docRoute('md', 'epub', 'pandoc', { lossy: false }),
    // ── Image conversions (worker-images) ─────────────────────────────────
    // TODO: HEIC support is a future addition — requires libheif with decoder support
    {
        kind: 'image',
        sourceExtension: 'png',
        targetExtension: 'jpg',
        label: 'PNG to JPG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'png',
        targetExtension: 'webp',
        label: 'PNG to WebP',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'jpg',
        targetExtension: 'png',
        label: 'JPG to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'jpg',
        targetExtension: 'webp',
        label: 'JPG to WebP',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'webp',
        targetExtension: 'png',
        label: 'WebP to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'webp',
        targetExtension: 'jpg',
        label: 'WebP to JPG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'gif',
        targetExtension: 'png',
        label: 'GIF to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'gif',
        targetExtension: 'webp',
        label: 'GIF to WebP',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'tiff',
        targetExtension: 'png',
        label: 'TIFF to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'tiff',
        targetExtension: 'jpg',
        label: 'TIFF to JPG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'bmp',
        targetExtension: 'png',
        label: 'BMP to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'svg',
        targetExtension: 'png',
        label: 'SVG to PNG',
        worker: 'worker-images',
    },
    {
        kind: 'image',
        sourceExtension: 'svg',
        targetExtension: 'jpg',
        label: 'SVG to JPG',
        worker: 'worker-images',
    },
];

export function isConversionExtension(
    value: string,
): value is ConversionExtension {
    return [
        'doc',
        'docx',
        'rtf',
        'ppt',
        'pptx',
        'xls',
        'xlsx',
        'ods',
        'odp',
        'odt',
        'html',
        'htm',
        'md',
        'markdown',
        'txt',
        'pdf',
        'csv',
        'epub',
        'png',
        'jpg',
        'jpeg',
        'webp',
        'gif',
        'tiff',
        'bmp',
        'svg',
    ].includes(value);
}

export function getConversionMetadata(
    sourceExtension: string,
    targetExtension: string,
) {
    return supportedConversionMatrix.find(
        (conversion) =>
            conversion.sourceExtension === sourceExtension &&
            conversion.targetExtension === targetExtension,
    );
}
