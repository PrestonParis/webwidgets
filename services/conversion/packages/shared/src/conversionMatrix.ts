import { normalizeExtension } from './schemas.js';
import type { SupportedConversion } from './types.js';

type DocumentEngine = 'libreoffice' | 'pandoc' | 'native';

function documentConversion(
  sourceExtension: string,
  targetExtension: string,
  engine: DocumentEngine,
  options: {
    lossy?: boolean;
    label?: string;
    notes?: string;
    warnings?: string[];
  } = {}
) {
  const source = normalizeExtension(sourceExtension) as SupportedConversion['sourceExtension'];
  const target = normalizeExtension(targetExtension) as SupportedConversion['targetExtension'];
  return {
    kind: 'document',
    sourceExtension: source,
    targetExtension: target,
    label: options.label ?? `${source.toUpperCase()} to ${target.toUpperCase()}`,
    worker: 'worker-docs',
    workerFamily: 'documents',
    engine,
    lossy: options.lossy ?? target === 'pdf',
    ...(options.notes ? { notes: options.notes } : {}),
    ...(options.warnings ? { warnings: options.warnings } : {})
  } satisfies SupportedConversion;
}

const pandocPdfWarning =
  'PDF output through Pandoc may require a local LaTeX PDF engine such as pdflatex, lualatex, or xelatex.';
const htmlSafetyWarning =
  'TODO: HTML input is not actively sanitized before conversion; scripts are not executed by Pandoc, but untrusted HTML needs a sanitizer pass.';

export const documentConversions = [
  // Office/text to PDF
  documentConversion('doc', 'pdf', 'libreoffice', { notes: 'Legacy Word layout fidelity is best-effort.' }),
  documentConversion('docx', 'pdf', 'libreoffice', { notes: 'Office layout fidelity is best-effort.' }),
  documentConversion('odt', 'pdf', 'libreoffice', { notes: 'OpenDocument layout fidelity is best-effort.' }),
  documentConversion('rtf', 'pdf', 'libreoffice', { notes: 'RTF layout fidelity is best-effort.' }),
  documentConversion('txt', 'pdf', 'pandoc', { warnings: [pandocPdfWarning] }),
  documentConversion('html', 'pdf', 'pandoc', { warnings: [pandocPdfWarning, htmlSafetyWarning] }),
  documentConversion('md', 'pdf', 'pandoc', { warnings: [pandocPdfWarning] }),

  // Text/markup
  documentConversion('md', 'html', 'pandoc', { lossy: false }),
  documentConversion('html', 'md', 'pandoc', { lossy: true, warnings: [htmlSafetyWarning] }),
  documentConversion('txt', 'md', 'native', {
    lossy: false,
    notes: 'Plain text is valid Markdown; content is preserved unchanged.'
  }),
  documentConversion('md', 'txt', 'pandoc', { lossy: true }),

  // Presentations
  documentConversion('ppt', 'pdf', 'libreoffice', { notes: 'Presentation layout fidelity is best-effort.' }),
  documentConversion('pptx', 'pdf', 'libreoffice', { notes: 'Presentation layout fidelity is best-effort.' }),
  documentConversion('odp', 'pdf', 'libreoffice', { notes: 'Presentation layout fidelity is best-effort.' }),

  // Spreadsheets
  documentConversion('xls', 'pdf', 'libreoffice', { notes: 'Spreadsheet pagination is best-effort.' }),
  documentConversion('xlsx', 'pdf', 'libreoffice', { notes: 'Spreadsheet pagination is best-effort.' }),
  documentConversion('ods', 'pdf', 'libreoffice', { notes: 'Spreadsheet pagination is best-effort.' }),
  documentConversion('csv', 'xlsx', 'libreoffice', { lossy: false }),
  documentConversion('csv', 'pdf', 'libreoffice', { notes: 'CSV is rendered as a spreadsheet before PDF export.' }),
  documentConversion('xlsx', 'csv', 'libreoffice', {
    lossy: true,
    notes: 'Exports the first sheet only.',
    warnings: ['XLSX to CSV exports the first sheet only. TODO: add multi-sheet export packaging.']
  }),

  // Ebook-ish / markup
  documentConversion('epub', 'pdf', 'pandoc', {
    lossy: true,
    notes: 'EPUB to PDF is best-effort when Pandoc can parse the EPUB cleanly.',
    warnings: [pandocPdfWarning, 'EPUB to PDF may be lossy.']
  }),
  documentConversion('epub', 'html', 'pandoc', {
    lossy: true,
    notes: 'EPUB chapters are flattened into a single HTML document.'
  }),
  documentConversion('html', 'epub', 'pandoc', {
    lossy: false,
    warnings: [htmlSafetyWarning]
  }),
  documentConversion('md', 'epub', 'pandoc', { lossy: false })
] as const satisfies readonly SupportedConversion[];

const imageConversions = [
  // TODO: HEIC support is a future addition - requires libheif with decoder support.
  { kind: 'image', sourceExtension: 'png',  targetExtension: 'jpg',  label: 'PNG to JPG',  worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'png',  targetExtension: 'webp', label: 'PNG to WebP', worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'jpg',  targetExtension: 'png',  label: 'JPG to PNG',  worker: 'worker-images', workerFamily: 'images', lossy: false },
  { kind: 'image', sourceExtension: 'jpg',  targetExtension: 'webp', label: 'JPG to WebP', worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'webp', targetExtension: 'png',  label: 'WebP to PNG', worker: 'worker-images', workerFamily: 'images', lossy: false },
  { kind: 'image', sourceExtension: 'webp', targetExtension: 'jpg',  label: 'WebP to JPG', worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'gif',  targetExtension: 'png',  label: 'GIF to PNG',  worker: 'worker-images', workerFamily: 'images', lossy: true, notes: 'First-frame extraction.' },
  { kind: 'image', sourceExtension: 'gif',  targetExtension: 'webp', label: 'GIF to WebP', worker: 'worker-images', workerFamily: 'images', lossy: false, notes: 'Animation is preserved.' },
  { kind: 'image', sourceExtension: 'tiff', targetExtension: 'png',  label: 'TIFF to PNG', worker: 'worker-images', workerFamily: 'images', lossy: false },
  { kind: 'image', sourceExtension: 'tiff', targetExtension: 'jpg',  label: 'TIFF to JPG', worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'bmp',  targetExtension: 'png',  label: 'BMP to PNG',  worker: 'worker-images', workerFamily: 'images', lossy: false },
  { kind: 'image', sourceExtension: 'svg',  targetExtension: 'png',  label: 'SVG to PNG',  worker: 'worker-images', workerFamily: 'images', lossy: true },
  { kind: 'image', sourceExtension: 'svg',  targetExtension: 'jpg',  label: 'SVG to JPG',  worker: 'worker-images', workerFamily: 'images', lossy: true }
] as const satisfies readonly SupportedConversion[];

export const supportedConversions: readonly SupportedConversion[] = [
  ...documentConversions,
  ...imageConversions
] as const;

export function findSupportedConversion(sourceExtension: string, targetExtension: string) {
  const source = normalizeExtension(sourceExtension);
  const target = normalizeExtension(targetExtension);
  return supportedConversions.find(
    (conversion) =>
      conversion.sourceExtension === source &&
      conversion.targetExtension === target
  );
}

export function getSupportedTargetsForSource(sourceExtension: string) {
  const source = normalizeExtension(sourceExtension);
  return supportedConversions
    .filter((conversion) => conversion.sourceExtension === source)
    .map((conversion) => conversion.targetExtension);
}

export function getConversionEngine(sourceExtension: string, targetExtension: string) {
  return findSupportedConversion(sourceExtension, targetExtension)?.engine;
}

export function isDocumentConversion(sourceExtension: string, targetExtension: string) {
  return findSupportedConversion(sourceExtension, targetExtension)?.kind === 'document';
}

export function getConversionKind(sourceExtension: string, targetExtension: string): 'document' | 'image' {
  return findSupportedConversion(sourceExtension, targetExtension)?.kind ?? 'document';
}
