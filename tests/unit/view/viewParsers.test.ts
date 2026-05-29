import { describe, expect, it } from 'vitest';
import { parseCsvFile } from '@/features/view/parsers/csvParser';
import { parseJsonFile } from '@/features/view/parsers/jsonParser';
import { parseTextLikeFile } from '@/features/view/parsers/textParser';

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
});
