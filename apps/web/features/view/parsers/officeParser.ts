import { unzipSync } from 'fflate';
import type { ViewParseInput } from '@/features/view/types/view';
import { normalizedDocument } from '@/features/view/parsers/parserUtils';

const decoder = new TextDecoder();

function decodeXml(value: string): string {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

function xmlText(value: string): string {
    return decodeXml(value.replace(/<[^>]+>/g, ''));
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function docxRunHtml(run: string): string {
    const properties = /<w:rPr\b[^>]*>([\s\S]*?)<\/w:rPr>/.exec(run)?.[1] ?? '';
    const rawText = run
        .replace(/<w:tab\b[^>]*\/>/g, '\t')
        .replace(/<w:br\b[^>]*\/>/g, '\n');
    let html = escapeHtml(xmlText(rawText));
    if (!html) return '';
    if (/<w:b\b/.test(properties)) html = `<strong>${html}</strong>`;
    if (/<w:i\b/.test(properties)) html = `<em>${html}</em>`;
    if (/<w:u\b/.test(properties)) html = `<u>${html}</u>`;
    if (/<w:strike\b/.test(properties)) html = `<s>${html}</s>`;
    return html.replace(/\n/g, '<br />').replace(/\t/g, '&emsp;');
}

function docxPreviewHtml(xml: string): string {
    const blocks: string[] = [];
    for (const match of xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
        const paragraph = match[1] ?? '';
        const runs = [...paragraph.matchAll(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g)]
            .map((run) => docxRunHtml(run[0]))
            .join('');
        const content = runs || escapeHtml(xmlText(paragraph));
        if (!content) continue;

        const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/.exec(paragraph)?.[1];
        const heading = style?.match(/^Heading([1-6])$/i)?.[1];
        if (heading) {
            blocks.push(`<h${heading}>${content}</h${heading}>`);
        } else if (/<w:numPr\b/.test(paragraph)) {
            blocks.push(`<ul><li>${content}</li></ul>`);
        } else {
            blocks.push(`<p>${content}</p>`);
        }
    }
    return blocks.join('\n');
}

function readEntry(files: Record<string, Uint8Array>, path: string): string {
    const value = files[path];
    if (!value) throw new Error(`Office document is missing ${path}`);
    return decoder.decode(value);
}

function parseDocx(input: ViewParseInput, files: Record<string, Uint8Array>) {
    const xml = readEntry(files, 'word/document.xml');
    const text = xml
        .replace(/<w:tab[^>]*\/>/g, '\t')
        .replace(/<w:br[^>]*\/>/g, '\n')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<\/w:tr>/g, '\n')
        .replace(/<\/w:tc>/g, '\t');
    const extracted = xmlText(text)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    const html = docxPreviewHtml(xml);

    return normalizedDocument({
        file: input.file,
        strategy: 'markdown_html',
        searchableText: extracted,
        renderable: { html },
        metadata: {
            format: 'docx',
            characterCount: extracted.length,
            preview: 'structured-html',
        },
        analysisHints: ['document-text', 'entity-extraction'],
        sanitized: true,
    });
}

function columnIndex(reference: string): number {
    const letters = reference.match(/[A-Z]+/)?.[0] ?? 'A';
    return (
        [...letters].reduce(
            (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
            0,
        ) - 1
    );
}

function parseXlsx(input: ViewParseInput, files: Record<string, Uint8Array>) {
    const sharedXml = files['xl/sharedStrings.xml']
        ? decoder.decode(files['xl/sharedStrings.xml'])
        : '';
    const sharedStrings = [
        ...sharedXml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g),
    ].map((match) => xmlText(match[1] ?? ''));
    const sheetPath = Object.keys(files)
        .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
        .sort()[0];
    if (!sheetPath) throw new Error('Workbook contains no worksheets');

    const sheetXml = readEntry(files, sheetPath);
    const matrix = [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)]
        .slice(0, 501)
        .map((rowMatch) => {
            const row: string[] = [];
            for (const cell of (rowMatch[1] ?? '').matchAll(
                /<c\b([^>]*)>([\s\S]*?)<\/c>/g,
            )) {
                const attrs = cell[1] ?? '';
                const body = cell[2] ?? '';
                const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? 'A';
                const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
                const raw = /<v[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '';
                const inline = /<is[^>]*>([\s\S]*?)<\/is>/.exec(body)?.[1];
                row[columnIndex(ref)] =
                    type === 's'
                        ? (sharedStrings[Number(raw)] ?? '')
                        : inline !== undefined
                          ? xmlText(inline)
                          : decodeXml(raw);
            }
            return row;
        });

    const width = Math.max(1, ...matrix.map((row) => row.length));
    const header = matrix[0] ?? [];
    const fields = Array.from(
        { length: width },
        (_, index) => header[index]?.trim() || `Column ${index + 1}`,
    );
    const rows = matrix
        .slice(1)
        .map((values) =>
            Object.fromEntries(
                fields.map((field, index) => [field, values[index] ?? '']),
            ),
        );

    return normalizedDocument({
        file: input.file,
        strategy: 'csv_table',
        searchableText: matrix.map((row) => row.join(' ')).join('\n'),
        renderable: { rows, fields, errors: [] },
        metadata: {
            format: 'xlsx',
            rowCount: rows.length,
            columnCount: fields.length,
            truncated: matrix.length > 500,
        },
        analysisHints: ['schema-inference', 'statistics'],
        sanitized: true,
    });
}

export function parseOfficeFile(input: ViewParseInput) {
    if (!input.bytes) throw new Error('Office file bytes were not provided');
    const files = unzipSync(new Uint8Array(input.bytes));
    return Promise.resolve(
        input.file.mimeType.includes('wordprocessingml')
            ? parseDocx(input, files)
            : parseXlsx(input, files),
    );
}
