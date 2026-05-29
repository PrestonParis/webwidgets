import { describe, expect, it } from 'vitest';
import { getRendererForMime } from '@/features/view/registry/rendererRegistry';
import { analyzeViewDocument } from '@/features/view/analyzers/viewAnalyzer';
import { planViewExport } from '@/features/view/exporters/exportRegistry';
import { parseTextLikeFile } from '@/features/view/parsers/textParser';

describe('view pipeline primitives', () => {
    it('resolves renderers by mime type', () => {
        expect(getRendererForMime('application/pdf')?.strategy).toBe(
            'pdf_canvas',
        );
        expect(getRendererForMime('image/png')?.strategy).toBe('image');
    });

    it('analyzes normalized text and plans exports', async () => {
        const doc = await parseTextLikeFile({
            file: {
                id: 'txt',
                name: 'note.txt',
                mimeType: 'text/plain',
                sizeBytes: 40,
                source: 'sample',
            },
            text: 'Alice met Bob on Jan 1, 2026.',
        });
        const analysis = analyzeViewDocument(doc);
        expect(analysis.entities).toContain('Alice');
        const exportPlan = planViewExport(doc, {
            fileId: 'txt',
            format: 'txt',
            destination: 'download',
            includeAnnotations: true,
        });
        expect(exportPlan.safe).toBe(true);
    });
});
