import type { ConversionExtension, SupportedConversion } from './core';

const pandocPdfWarning =
    'PDF output through Pandoc may require a local LaTeX PDF engine such as pdflatex, lualatex, or xelatex.';
const htmlSafetyWarning =
    'TODO: HTML input is not actively sanitized before conversion; scripts are not executed by Pandoc, but untrusted HTML needs a sanitizer pass.';

function docRoute(
    sourceExtension: ConversionExtension,
    targetExtension: ConversionExtension,
    engine: NonNullable<SupportedConversion['engine']>,
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

    // PDF-sourced conversions. Keep this in sync with the conversion service
    // matrix so the client does not reject supported remote routes.
    docRoute('pdf', 'txt', 'pdftotext', {
        lossy: true,
        notes: 'Text layer only; scanned/image-only PDFs will produce empty output.',
    }),
    docRoute('pdf', 'html', 'pdftohtml', {
        lossy: true,
        notes: 'Best-effort positional HTML; layout may differ from the original.',
    }),
    docRoute('pdf', 'md', 'pdftotext', {
        lossy: true,
        notes: 'Plain text wrapped in minimal Markdown structure.',
    }),
    docRoute('pdf', 'docx', 'libreoffice-pdf', {
        lossy: true,
        notes: 'Uses LibreOffice Draw PDF Import. Text boxes, not reflowable prose. Scanned PDFs not supported.',
        warnings: [
            'PDF to DOCX uses Draw PDF Import. Formatting fidelity is best-effort and complex layouts may not round-trip cleanly.',
        ],
    }),
    docRoute('pdf', 'odt', 'libreoffice-pdf', {
        lossy: true,
        notes: 'Uses LibreOffice Draw PDF Import. Same fidelity caveats as PDF to DOCX.',
    }),
    docRoute('pdf', 'rtf', 'libreoffice-pdf', {
        lossy: true,
        notes: 'PDF imported via LibreOffice Draw then exported to RTF.',
    }),
    docRoute('pdf', 'epub', 'pdftoepub', {
        lossy: true,
        notes: 'Text layer extracted with pdftotext, then wrapped as EPUB via Pandoc. Images and layout are not preserved.',
        warnings: [
            'PDF to EPUB is text-only. Images, tables, and complex formatting are dropped.',
        ],
    }),
    docRoute('pdf', 'png', 'pdftoppm-png', {
        lossy: true,
        notes: 'Rasterizes the first PDF page to PNG.',
    }),
    docRoute('pdf', 'jpg', 'pdftoppm-jpg', {
        lossy: true,
        notes: 'Rasterizes the first PDF page to JPEG.',
    }),

    // ── Image conversions (worker-images) ─────────────────────────────────
    // Future: HEIC support requires libheif with decoder support.
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
