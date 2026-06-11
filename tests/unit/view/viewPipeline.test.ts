import { expect, it } from 'vitest';
import { getRendererForMime } from '@/features/view/registry/rendererRegistry';
import { analyzeViewDocument } from '@/features/view/analyzers/viewAnalyzer';
import { planViewExport } from '@/features/view/exporters/exportRegistry';
import { parseTextLikeFile } from '@/features/view/parsers/textParser';
import { viewAnnotationSchema } from '@/features/view/schemas/objectSchemas';
import { uploadFileContent } from '@/features/uploads/api/uploadApi';
import { rewritePdfContentStreamText } from '@/features/view/pdf/pdfContentStreamEditor';

it('resolves renderers by mime type', () => {
    expect(getRendererForMime('application/pdf')?.strategy).toBe('pdf_canvas');
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

it('supports editable PDF text annotations', () => {
    const result = viewAnnotationSchema.safeParse({
        id: 'annotation-1',
        fileId: 'pdf-1',
        kind: 'text',
        layerId: 'annotations',
        geometry: { page: 1, x: 12, y: 18, width: 24, height: 7 },
        text: 'Edited in place',
        color: '#111827',
        createdAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
    expect(typeof uploadFileContent).toBe('function');
});

it('supports PDF signature annotations', () => {
    const result = viewAnnotationSchema.safeParse({
        id: 'signature-1',
        fileId: 'pdf-1',
        kind: 'signature',
        layerId: 'annotations',
        geometry: { page: 2, x: 52, y: 72, width: 28, height: 10 },
        text: 'data:image/png;base64,iVBORw0KGgo=',
        color: '#111827',
        createdAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
});

it('supports whiteout-backed PDF text replacement', () => {
    const whiteout = viewAnnotationSchema.safeParse({
        id: 'whiteout-1',
        fileId: 'pdf-1',
        kind: 'redaction',
        layerId: 'drawings',
        geometry: { page: 1, x: 20, y: 22, width: 18, height: 3 },
        text: 'Original copy',
        color: '#ffffff',
        createdAt: new Date().toISOString(),
    });
    const replacement = viewAnnotationSchema.safeParse({
        id: 'replacement-1',
        fileId: 'pdf-1',
        kind: 'text',
        layerId: 'annotations',
        geometry: { page: 1, x: 20, y: 22, width: 18, height: 3 },
        text: 'Replacement copy',
        color: '#111827',
        createdAt: new Date().toISOString(),
    });

    expect(whiteout.success).toBe(true);
    expect(replacement.success).toBe(true);
});

it('rewrites literal PDF text-showing operators in the content stream', () => {
    const result = rewritePdfContentStreamText(
        'BT /F1 12 Tf (Original copy) Tj ET',
        [
            {
                whiteoutId: 'whiteout-1',
                textId: 'replacement-1',
                pageNumber: 1,
                originalText: 'Original copy',
                replacementText: 'Replacement copy',
            },
        ],
    );

    expect(result.changed).toBe(true);
    expect(result.results[0]?.applied).toBe(true);
    expect(result.content).toContain('(Replacement copy) Tj');
    expect(result.content).not.toContain('Original copy');
});

it('rewrites exact PDF text arrays as native text operators', () => {
    const result = rewritePdfContentStreamText(
        'BT [(Original) 20 ( copy)] TJ ET',
        [
            {
                whiteoutId: 'whiteout-1',
                textId: 'replacement-1',
                pageNumber: 1,
                originalText: 'Original copy',
                replacementText: 'Replacement copy',
            },
        ],
    );

    expect(result.changed).toBe(true);
    expect(result.content).toContain('(Replacement copy) Tj');
});

it('declines ambiguous native PDF text replacements', () => {
    const result = rewritePdfContentStreamText('BT (Total) Tj (Total) Tj ET', [
        {
            whiteoutId: 'whiteout-1',
            textId: 'replacement-1',
            pageNumber: 1,
            originalText: 'Total',
            replacementText: 'Subtotal',
        },
    ]);

    expect(result.changed).toBe(false);
    expect(result.results[0]?.applied).toBe(false);
    expect(result.results[0]?.reason).toBe('ambiguous-text');
});
