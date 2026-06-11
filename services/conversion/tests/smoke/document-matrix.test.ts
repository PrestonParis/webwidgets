import { describe, expect, it } from 'vitest';
import {
    findSupportedConversion,
    getConversionEngine,
    getSupportedTargetsForSource,
    isDocumentConversion,
    supportedConversions,
} from '../../packages/shared/src/conversionMatrix.js';

const requiredPairs = [
    ['doc', 'pdf', 'libreoffice'],
    ['docx', 'pdf', 'libreoffice'],
    ['odt', 'pdf', 'libreoffice'],
    ['rtf', 'pdf', 'libreoffice'],
    ['txt', 'pdf', 'pandoc'],
    ['html', 'pdf', 'pandoc'],
    ['md', 'pdf', 'pandoc'],
    ['md', 'html', 'pandoc'],
    ['html', 'md', 'pandoc'],
    ['txt', 'md', 'native'],
    ['md', 'txt', 'pandoc'],
    ['ppt', 'pdf', 'libreoffice'],
    ['pptx', 'pdf', 'libreoffice'],
    ['odp', 'pdf', 'libreoffice'],
    ['xls', 'pdf', 'libreoffice'],
    ['xlsx', 'pdf', 'libreoffice'],
    ['ods', 'pdf', 'libreoffice'],
    ['csv', 'xlsx', 'libreoffice'],
    ['csv', 'pdf', 'libreoffice'],
    ['xlsx', 'csv', 'libreoffice'],
    ['epub', 'pdf', 'pandoc'],
    ['epub', 'html', 'pandoc'],
    ['html', 'epub', 'pandoc'],
    ['md', 'epub', 'pandoc'],
    ['pdf', 'txt', 'pdftotext'],
    ['pdf', 'html', 'pdftohtml'],
    ['pdf', 'md', 'pdftotext'],
    ['pdf', 'docx', 'libreoffice-pdf'],
    ['pdf', 'odt', 'libreoffice-pdf'],
    ['pdf', 'rtf', 'libreoffice-pdf'],
    ['pdf', 'epub', 'pdftoepub'],
    ['pdf', 'png', 'pdftoppm-png'],
    ['pdf', 'jpg', 'pdftoppm-jpg'],
] as const;

describe('document conversion matrix', () => {
    it('includes all required document pairs with engine metadata', () => {
        for (const [source, target, engine] of requiredPairs) {
            const conversion = findSupportedConversion(source, target);
            expect(conversion, `${source} to ${target}`).toBeTruthy();
            expect(conversion?.workerFamily).toBe('documents');
            expect(conversion?.engine).toBe(engine);
            expect(typeof conversion?.lossy).toBe('boolean');
            expect(isDocumentConversion(source, target)).toBe(true);
            expect(getConversionEngine(source, target)).toBe(engine);
        }
    });

    it('rejects unsupported pairs', () => {
        expect(findSupportedConversion('pdf', 'xlsx')).toBeUndefined();
        expect(findSupportedConversion('txt', 'xlsx')).toBeUndefined();
        expect(findSupportedConversion('epub', 'xlsx')).toBeUndefined();
    });

    it('exposes supported targets for a source extension', () => {
        expect(getSupportedTargetsForSource('md')).toEqual(
            expect.arrayContaining(['pdf', 'html', 'txt', 'epub']),
        );
        expect(getSupportedTargetsForSource('markdown')).toEqual(
            expect.arrayContaining(['pdf', 'html', 'txt', 'epub']),
        );
        expect(getSupportedTargetsForSource('htm')).toEqual(
            expect.arrayContaining(['pdf', 'md', 'epub']),
        );
        expect(getSupportedTargetsForSource('pdf')).toEqual(
            expect.arrayContaining(['docx', 'txt', 'html', 'md', 'epub']),
        );
    });

    it('keeps xlsx to csv first-sheet warning visible', () => {
        const conversion = findSupportedConversion('xlsx', 'csv');
        expect(conversion?.warnings?.join(' ')).toMatch(/first sheet only/i);
    });

    it('does not duplicate normalized document pairs', () => {
        const documentPairs = supportedConversions
            .filter((conversion) => conversion.kind === 'document')
            .map(
                (conversion) =>
                    `${conversion.sourceExtension}:${conversion.targetExtension}`,
            );
        expect(new Set(documentPairs).size).toBe(documentPairs.length);
    });
});
