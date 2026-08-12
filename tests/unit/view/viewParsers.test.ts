import { describe, expect, it } from 'vitest';
import { parseCsvFile } from '@/features/view/parsers/csvParser';
import { parseJsonFile } from '@/features/view/parsers/jsonParser';
import { parseTextLikeFile } from '@/features/view/parsers/textParser';
import { parseOfficeFile } from '@/features/view/parsers/officeParser';
import { strToU8, zipSync } from 'fflate';

describe('view parsers', () => {
    it('normalizes markdown into sanitized renderable html', async () => {
        const doc = await parseTextLikeFile({
            file: {
                id: 'md',
                name: 'note.md',
                mimeType: 'text/markdown',
                sizeBytes: 20,
                source: 'sample',
            },
            text: '# Hello',
        });
        expect(doc.strategy).toBe('markdown_html');
        expect(doc.searchableText).toContain('Hello');
    });

    it('infers csv rows and fields', async () => {
        const doc = await parseCsvFile({
            file: {
                id: 'csv',
                name: 'data.csv',
                mimeType: 'text/csv',
                sizeBytes: 20,
                source: 'sample',
            },
            text: 'name,value\nA,1',
        });
        expect(doc.strategy).toBe('csv_table');
        expect(doc.metadata.fields).toEqual(['name', 'value']);
    });

    it('extracts json schema shape', async () => {
        const doc = await parseJsonFile({
            file: {
                id: 'json',
                name: 'data.json',
                mimeType: 'application/json',
                sizeBytes: 20,
                source: 'sample',
            },
            text: '{"name":"A","value":1}',
        });
        expect(doc.strategy).toBe('json_tree');
        expect(doc.metadata.rootType).toBe('object');
    });

    it('extracts DOCX paragraph text', async () => {
        const bytes = zipSync({
            'word/document.xml': strToU8(
                '<w:document><w:body><w:p><w:r><w:t>Hello document</w:t></w:r></w:p></w:body></w:document>',
            ),
        });
        const doc = await parseOfficeFile({
            file: {
                id: 'docx',
                name: 'document.docx',
                mimeType:
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                sizeBytes: bytes.byteLength,
                source: 'sample',
            },
            bytes: bytes.buffer as ArrayBuffer,
        });
        expect(doc.strategy).toBe('markdown_html');
        expect(doc.searchableText).toBe('Hello document');
        expect(doc.renderable).toMatchObject({
            html: '<p>Hello document</p>',
        });
    });

    it('preserves basic DOCX formatting in its preview', async () => {
        const bytes = zipSync({
            'word/document.xml': strToU8(
                '<w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Title</w:t></w:r></w:p><w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Body</w:t></w:r></w:p></w:body></w:document>',
            ),
        });
        const doc = await parseOfficeFile({
            file: {
                id: 'formatted-docx',
                name: 'formatted.docx',
                mimeType:
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                sizeBytes: bytes.byteLength,
                source: 'sample',
            },
            bytes: bytes.buffer as ArrayBuffer,
        });

        expect(doc.renderable).toMatchObject({
            html: '<h1><strong>Title</strong></h1>\n<p><em>Body</em></p>',
        });
    });

    it('renders the first XLSX worksheet as a table', async () => {
        const bytes = zipSync({
            'xl/sharedStrings.xml': strToU8(
                '<sst><si><t>Name</t></si><si><t>Ada</t></si></sst>',
            ),
            'xl/worksheets/sheet1.xml': strToU8(
                '<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1"><v>Score</v></c></row><row><c r="A2" t="s"><v>1</v></c><c r="B2"><v>42</v></c></row></sheetData></worksheet>',
            ),
        });
        const doc = await parseOfficeFile({
            file: {
                id: 'xlsx',
                name: 'sheet.xlsx',
                mimeType:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                sizeBytes: bytes.byteLength,
                source: 'sample',
            },
            bytes: bytes.buffer as ArrayBuffer,
        });
        expect(doc.strategy).toBe('csv_table');
        expect(doc.renderable).toMatchObject({
            fields: ['Name', 'Score'],
            rows: [{ Name: 'Ada', Score: '42' }],
        });
    });
});
