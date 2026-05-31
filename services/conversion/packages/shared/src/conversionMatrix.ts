import { normalizeExtension } from './schemas.js';
import type { SupportedConversion } from './types.js';

type DocumentEngine =
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

function documentConversion(
    sourceExtension: string,
    targetExtension: string,
    engine: DocumentEngine,
    options: {
        lossy?: boolean;
        label?: string;
        notes?: string;
        warnings?: string[];
    } = {},
) {
    const source = normalizeExtension(
        sourceExtension,
    ) as SupportedConversion['sourceExtension'];
    const target = normalizeExtension(
        targetExtension,
    ) as SupportedConversion['targetExtension'];
    return {
        kind: 'document',
        sourceExtension: source,
        targetExtension: target,
        label:
            options.label ??
            `${source.toUpperCase()} to ${target.toUpperCase()}`,
        worker: 'worker-docs',
        workerFamily: 'documents',
        engine,
        lossy: options.lossy ?? target === 'pdf',
        ...(options.notes ? { notes: options.notes } : {}),
        ...(options.warnings ? { warnings: options.warnings } : {}),
    } satisfies SupportedConversion;
}

const pandocPdfWarning =
    'PDF output through Pandoc may require a local LaTeX PDF engine such as pdflatex, lualatex, or xelatex.';
const htmlSafetyWarning =
    'TODO: HTML input is not actively sanitized before conversion; scripts are not executed by Pandoc, but untrusted HTML needs a sanitizer pass.';

export const documentConversions = [
    // Office/text to PDF
    documentConversion('doc', 'pdf', 'libreoffice', {
        notes: 'Legacy Word layout fidelity is best-effort.',
    }),
    documentConversion('docx', 'pdf', 'libreoffice', {
        notes: 'Office layout fidelity is best-effort.',
    }),
    documentConversion('odt', 'pdf', 'libreoffice', {
        notes: 'OpenDocument layout fidelity is best-effort.',
    }),
    documentConversion('rtf', 'pdf', 'libreoffice', {
        notes: 'RTF layout fidelity is best-effort.',
    }),
    documentConversion('txt', 'pdf', 'pandoc', {
        warnings: [pandocPdfWarning],
    }),
    documentConversion('html', 'pdf', 'pandoc', {
        warnings: [pandocPdfWarning, htmlSafetyWarning],
    }),
    documentConversion('md', 'pdf', 'pandoc', { warnings: [pandocPdfWarning] }),

    // Text/markup
    documentConversion('md', 'html', 'pandoc', { lossy: false }),
    documentConversion('html', 'md', 'pandoc', {
        lossy: true,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('txt', 'md', 'native', {
        lossy: false,
        notes: 'Plain text is valid Markdown; content is preserved unchanged.',
    }),
    documentConversion('md', 'txt', 'pandoc', { lossy: true }),

    // Presentations
    documentConversion('ppt', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),
    documentConversion('pptx', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),
    documentConversion('odp', 'pdf', 'libreoffice', {
        notes: 'Presentation layout fidelity is best-effort.',
    }),

    // Spreadsheets
    documentConversion('xls', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    documentConversion('xlsx', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    documentConversion('ods', 'pdf', 'libreoffice', {
        notes: 'Spreadsheet pagination is best-effort.',
    }),
    documentConversion('csv', 'xlsx', 'libreoffice', { lossy: false }),
    documentConversion('csv', 'pdf', 'libreoffice', {
        notes: 'CSV is rendered as a spreadsheet before PDF export.',
    }),
    documentConversion('xlsx', 'csv', 'libreoffice', {
        lossy: true,
        notes: 'Exports the first sheet only.',
        warnings: [
            'XLSX to CSV exports the first sheet only. TODO: add multi-sheet export packaging.',
        ],
    }),

    // Ebook-ish / markup
    documentConversion('epub', 'pdf', 'pandoc', {
        lossy: true,
        notes: 'EPUB to PDF is best-effort when Pandoc can parse the EPUB cleanly.',
        warnings: [pandocPdfWarning, 'EPUB to PDF may be lossy.'],
    }),
    documentConversion('epub', 'html', 'pandoc', {
        lossy: true,
        notes: 'EPUB chapters are flattened into a single HTML document.',
    }),
    documentConversion('html', 'epub', 'pandoc', {
        lossy: false,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('md', 'epub', 'pandoc', { lossy: false }),

    // ── Text extraction (→ txt) ───────────────────────────────────────────────
    // All via Pandoc plain-text output; lossy because formatting is stripped.
    documentConversion('docx', 'txt', 'pandoc', { lossy: true }),
    documentConversion('odt', 'txt', 'pandoc', { lossy: true }),
    documentConversion('rtf', 'txt', 'pandoc', { lossy: true }),
    documentConversion('html', 'txt', 'pandoc', {
        lossy: true,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('epub', 'txt', 'pandoc', { lossy: true }),
    documentConversion('pptx', 'txt', 'pandoc', {
        lossy: true,
        notes: 'Slide text only; images and charts are dropped.',
    }),
    documentConversion('doc', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'Legacy binary format extracted via LibreOffice.',
    }),
    documentConversion('xls', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'First sheet only.',
    }),
    documentConversion('xlsx', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'First sheet only.',
    }),
    documentConversion('ods', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'First sheet only.',
    }),
    documentConversion('csv', 'txt', 'native', {
        lossy: false,
        notes: 'CSV is valid plain text; content is preserved unchanged.',
    }),

    // ── Markdown extraction (→ md) ────────────────────────────────────────────
    documentConversion('docx', 'md', 'pandoc', {
        lossy: true,
        notes: 'Complex formatting (tables, columns) is simplified.',
    }),
    documentConversion('odt', 'md', 'pandoc', { lossy: true }),
    documentConversion('rtf', 'md', 'pandoc', { lossy: true }),

    // ── HTML output ───────────────────────────────────────────────────────────
    documentConversion('docx', 'html', 'pandoc', { lossy: false }),
    documentConversion('odt', 'html', 'pandoc', { lossy: false }),
    documentConversion('rtf', 'html', 'pandoc', { lossy: true }),
    documentConversion('txt', 'html', 'pandoc', { lossy: false }),
    documentConversion('doc', 'html', 'libreoffice', {
        lossy: false,
        notes: 'LibreOffice HTML output; inline styles are verbose.',
    }),

    // ── SVG → PDF ─────────────────────────────────────────────────────────────
    documentConversion('svg', 'pdf', 'libreoffice', { lossy: false }),

    // ── PDF extraction ────────────────────────────────────────────────────────
    // Uses pdftotext / pdftohtml from poppler-utils (installed in worker-docs).
    documentConversion('pdf', 'txt', 'pdftotext', {
        lossy: true,
        notes: 'Text layer only; scanned/image-only PDFs will produce empty output.',
    }),
    documentConversion('pdf', 'html', 'pdftohtml', {
        lossy: true,
        notes: 'Best-effort positional HTML; layout may differ from the original.',
    }),
    documentConversion('pdf', 'md', 'pdftotext', {
        lossy: true,
        notes: 'Plain text wrapped in minimal Markdown structure.',
    }),

    // ── PDF → editable office formats ─────────────────────────────────────────
    // Uses LibreOffice Draw PDF Import filter. Output is editable but
    // layout-based (text boxes), not reflowable prose. Best for structured
    // PDFs; handwriting/scanned PDFs produce empty or garbled output.
    documentConversion('pdf', 'docx', 'libreoffice-pdf', {
        lossy: true,
        notes: 'Uses LibreOffice Draw PDF Import. Text boxes, not reflowable prose. Scanned PDFs not supported.',
        warnings: [
            'PDF to DOCX uses Draw PDF Import — formatting fidelity is best-effort. Complex layouts may not round-trip cleanly.',
        ],
    }),
    documentConversion('pdf', 'odt', 'libreoffice-pdf', {
        lossy: true,
        notes: 'Uses LibreOffice Draw PDF Import. Same fidelity caveats as PDF to DOCX.',
    }),
    documentConversion('pdf', 'rtf', 'libreoffice-pdf', {
        lossy: true,
        notes: 'PDF imported via LibreOffice Draw then exported to RTF.',
    }),

    // ── PDF → EPUB ────────────────────────────────────────────────────────────
    // Two-step: pdftotext extracts the text layer, then Pandoc wraps it as EPUB.
    // Result is readable prose; images and complex layout are lost.
    documentConversion('pdf', 'epub', 'pdftoepub', {
        lossy: true,
        notes: 'Text layer extracted with pdftotext, then wrapped as EPUB via Pandoc. Images and layout are not preserved.',
        warnings: [
            'PDF to EPUB is text-only. Images, tables, and complex formatting are dropped.',
        ],
    }),

    // ── Remaining text extraction ─────────────────────────────────────────────
    documentConversion('ppt', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'Legacy binary format; slide text only.',
    }),
    documentConversion('odp', 'txt', 'libreoffice', {
        lossy: true,
        notes: 'Slide text only.',
    }),

    // ── Office format upgrades (LibreOffice) ──────────────────────────────────
    documentConversion('doc', 'docx', 'libreoffice', {
        lossy: false,
        notes: 'Legacy Word format upgraded to modern OOXML.',
    }),
    documentConversion('doc', 'odt', 'libreoffice', { lossy: false }),
    documentConversion('odt', 'docx', 'libreoffice', { lossy: false }),
    documentConversion('ppt', 'pptx', 'libreoffice', {
        lossy: false,
        notes: 'Legacy PowerPoint format upgraded to modern OOXML.',
    }),
    documentConversion('odp', 'pptx', 'libreoffice', { lossy: false }),
    documentConversion('xls', 'xlsx', 'libreoffice', {
        lossy: false,
        notes: 'Legacy Excel format upgraded to modern OOXML.',
    }),
    documentConversion('ods', 'xlsx', 'libreoffice', { lossy: false }),

    // ── Spreadsheet → HTML ────────────────────────────────────────────────────
    documentConversion('xlsx', 'html', 'libreoffice', {
        lossy: false,
        notes: 'Table rendered to HTML; styling is inline.',
    }),
    documentConversion('xls', 'html', 'libreoffice', {
        lossy: false,
        notes: 'First sheet only.',
    }),
    documentConversion('ods', 'html', 'libreoffice', { lossy: false }),
    documentConversion('csv', 'html', 'libreoffice', {
        lossy: false,
        notes: 'CSV rendered as an HTML table.',
    }),

    // ── → DOCX (Pandoc) ───────────────────────────────────────────────────────
    documentConversion('md', 'docx', 'pandoc', { lossy: false }),
    documentConversion('html', 'docx', 'pandoc', {
        lossy: false,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('txt', 'docx', 'pandoc', { lossy: false }),
    documentConversion('rtf', 'docx', 'pandoc', { lossy: true }),
    documentConversion('epub', 'docx', 'pandoc', { lossy: true }),

    // ── → ODT (Pandoc) ────────────────────────────────────────────────────────
    documentConversion('md', 'odt', 'pandoc', { lossy: false }),
    documentConversion('html', 'odt', 'pandoc', {
        lossy: false,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('txt', 'odt', 'pandoc', { lossy: false }),
    documentConversion('rtf', 'odt', 'pandoc', { lossy: true }),
    documentConversion('epub', 'odt', 'pandoc', { lossy: true }),
    documentConversion('docx', 'odt', 'pandoc', { lossy: false }),

    // ── → RTF (Pandoc) ────────────────────────────────────────────────────────
    documentConversion('md', 'rtf', 'pandoc', { lossy: false }),
    documentConversion('html', 'rtf', 'pandoc', {
        lossy: false,
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('txt', 'rtf', 'pandoc', { lossy: false }),
    documentConversion('docx', 'rtf', 'pandoc', { lossy: true }),
    documentConversion('odt', 'rtf', 'pandoc', { lossy: true }),
    documentConversion('epub', 'rtf', 'pandoc', { lossy: true }),

    // ── Cross-markup (Pandoc) ─────────────────────────────────────────────────
    documentConversion('epub', 'md', 'pandoc', {
        lossy: true,
        notes: 'EPUB chapters flattened to GitHub-Flavoured Markdown.',
    }),
    documentConversion('docx', 'epub', 'pandoc', { lossy: false }),
    documentConversion('odt', 'epub', 'pandoc', { lossy: false }),

    // ── txt → epub ────────────────────────────────────────────────────────────
    documentConversion('txt', 'epub', 'pandoc', {
        lossy: false,
        notes: 'Plain text wrapped as EPUB via Pandoc.',
    }),

    // ── PPTX extraction (Pandoc) ──────────────────────────────────────────────
    // Pandoc reads PPTX natively; slide text is extracted, images dropped.
    documentConversion('pptx', 'html', 'pandoc', {
        lossy: true,
        notes: 'Slide text only; images and charts are dropped.',
    }),
    documentConversion('pptx', 'md', 'pandoc', {
        lossy: true,
        notes: 'Slide text only; images and charts are dropped.',
    }),
    documentConversion('pptx', 'epub', 'pandoc', {
        lossy: true,
        notes: 'Slides converted to EPUB chapters. Images dropped.',
    }),
    documentConversion('pptx', 'docx', 'pandoc', {
        lossy: true,
        notes: 'Slide content flattened to a Word document.',
    }),
    documentConversion('pptx', 'odt', 'pandoc', {
        lossy: true,
        notes: 'Slide content flattened to an ODT document.',
    }),

    // ── → PPTX (Pandoc) ───────────────────────────────────────────────────────
    // Pandoc creates a presentation from headings: H1/H2 become slide titles.
    documentConversion('md', 'pptx', 'pandoc', {
        lossy: false,
        notes: 'H1/H2 headings become slide titles. No image support.',
    }),
    documentConversion('html', 'pptx', 'pandoc', {
        lossy: false,
        notes: 'H1/H2 headings become slides.',
        warnings: [htmlSafetyWarning],
    }),
    documentConversion('txt', 'pptx', 'pandoc', {
        lossy: false,
        notes: 'Sections separated by blank lines become slides.',
    }),
    documentConversion('docx', 'pptx', 'pandoc', {
        lossy: true,
        notes: 'Heading levels map to slide titles.',
    }),
    documentConversion('rst', 'pptx', 'pandoc', {
        lossy: false,
        notes: 'RST sections become slides.',
    }),

    // ── Spreadsheet / tabular → Markdown ─────────────────────────────────────
    // Pandoc renders these as GFM pipe tables.
    documentConversion('xlsx', 'md', 'pandoc', {
        lossy: true,
        notes: 'First sheet rendered as a GFM pipe table.',
    }),
    documentConversion('csv', 'md', 'pandoc', {
        lossy: false,
        notes: 'CSV rendered as a GFM pipe table.',
    }),
    documentConversion('tsv', 'md', 'pandoc', {
        lossy: false,
        notes: 'TSV rendered as a GFM pipe table.',
    }),
    documentConversion('tsv', 'html', 'pandoc', {
        lossy: false,
        notes: 'TSV rendered as an HTML table.',
    }),

    // ── LibreOffice spreadsheet upgrades ──────────────────────────────────────
    documentConversion('xlsx', 'ods', 'libreoffice', { lossy: false }),
    documentConversion('xls', 'ods', 'libreoffice', { lossy: false }),
    documentConversion('ods', 'csv', 'libreoffice', {
        lossy: true,
        notes: 'Exports the first sheet only.',
    }),

    // ── Structured data (native-data engine) ─────────────────────────────────
    // csv → json: each row becomes an object keyed by the header row.
    // xlsx → json: LibreOffice exports to CSV first, then same parse.
    // tsv → csv / tsv → json: delimiter swap then same parse path.
    documentConversion('csv', 'json', 'native-data', {
        lossy: false,
        notes: 'Header row becomes object keys; each data row becomes an object.',
    }),
    documentConversion('tsv', 'csv', 'native-data', {
        lossy: false,
        notes: 'Tab-delimited input converted to comma-delimited output.',
    }),
    documentConversion('tsv', 'json', 'native-data', {
        lossy: false,
        notes: 'Header row becomes object keys; each data row becomes an object.',
    }),
    documentConversion('xlsx', 'json', 'native-data', {
        lossy: true,
        notes: 'First sheet exported via LibreOffice to CSV, then parsed to JSON.',
    }),

    // ── PDF → raster images (pdftoppm) ───────────────────────────────────────
    // pdftoppm is from poppler-utils, installed in the worker-docs Docker image.
    // First page only. Multi-page → ZIP is a future addition.
    documentConversion('pdf', 'png', 'pdftoppm-png', {
        lossy: false,
        notes: 'First page only. Rasterised at 150 DPI. Scanned PDFs are supported.',
    }),
    documentConversion('pdf', 'jpg', 'pdftoppm-jpg', {
        lossy: true,
        notes: 'First page only. Rasterised at 150 DPI.',
    }),
] as const satisfies readonly SupportedConversion[];

const imageConversions = [
    // TODO: HEIC support is a future addition - requires libheif with decoder support.
    {
        kind: 'image',
        sourceExtension: 'png',
        targetExtension: 'jpg',
        label: 'PNG to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'png',
        targetExtension: 'webp',
        label: 'PNG to WebP',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'jpg',
        targetExtension: 'png',
        label: 'JPG to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: false,
    },
    {
        kind: 'image',
        sourceExtension: 'jpg',
        targetExtension: 'webp',
        label: 'JPG to WebP',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'webp',
        targetExtension: 'png',
        label: 'WebP to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: false,
    },
    {
        kind: 'image',
        sourceExtension: 'webp',
        targetExtension: 'jpg',
        label: 'WebP to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'gif',
        targetExtension: 'png',
        label: 'GIF to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
        notes: 'First-frame extraction.',
    },
    {
        kind: 'image',
        sourceExtension: 'gif',
        targetExtension: 'webp',
        label: 'GIF to WebP',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: false,
        notes: 'Animation is preserved.',
    },
    {
        kind: 'image',
        sourceExtension: 'tiff',
        targetExtension: 'png',
        label: 'TIFF to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: false,
    },
    {
        kind: 'image',
        sourceExtension: 'tiff',
        targetExtension: 'jpg',
        label: 'TIFF to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'bmp',
        targetExtension: 'png',
        label: 'BMP to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: false,
    },
    {
        kind: 'image',
        sourceExtension: 'svg',
        targetExtension: 'png',
        label: 'SVG to PNG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'svg',
        targetExtension: 'jpg',
        label: 'SVG to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    // ── Additional raster conversions (sharp reads these natively) ────────────
    {
        kind: 'image',
        sourceExtension: 'tiff',
        targetExtension: 'webp',
        label: 'TIFF to WebP',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'bmp',
        targetExtension: 'jpg',
        label: 'BMP to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'bmp',
        targetExtension: 'webp',
        label: 'BMP to WebP',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
    },
    {
        kind: 'image',
        sourceExtension: 'gif',
        targetExtension: 'jpg',
        label: 'GIF to JPG',
        worker: 'worker-images',
        workerFamily: 'images',
        lossy: true,
        notes: 'First-frame extraction.',
    },
] as const satisfies readonly SupportedConversion[];

export const supportedConversions: readonly SupportedConversion[] = [
    ...documentConversions,
    ...imageConversions,
] as const;

export function findSupportedConversion(
    sourceExtension: string,
    targetExtension: string,
) {
    const source = normalizeExtension(sourceExtension);
    const target = normalizeExtension(targetExtension);
    return supportedConversions.find(
        (conversion) =>
            conversion.sourceExtension === source &&
            conversion.targetExtension === target,
    );
}

export function getSupportedTargetsForSource(sourceExtension: string) {
    const source = normalizeExtension(sourceExtension);
    return supportedConversions
        .filter((conversion) => conversion.sourceExtension === source)
        .map((conversion) => conversion.targetExtension);
}

export function getConversionEngine(
    sourceExtension: string,
    targetExtension: string,
) {
    return findSupportedConversion(sourceExtension, targetExtension)?.engine;
}

export function isDocumentConversion(
    sourceExtension: string,
    targetExtension: string,
) {
    return (
        findSupportedConversion(sourceExtension, targetExtension)?.kind ===
        'document'
    );
}

export function getConversionKind(
    sourceExtension: string,
    targetExtension: string,
): 'document' | 'image' {
    return (
        findSupportedConversion(sourceExtension, targetExtension)?.kind ??
        'document'
    );
}
