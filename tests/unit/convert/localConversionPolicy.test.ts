import { describe, expect, it } from 'vitest';
import {
    chooseLocalOrRemoteConversion,
    getTargetsForSource,
} from '@/features/convert/lib/localConversionPolicy';
import { getConversionMetadata } from '@/features/convert/types/conversion';

function makeFile(name: string, type: string, content = 'fixture') {
    return new File([content], name, { type });
}

describe('conversion local/remote policy', () => {
    it('routes PDF to DOCX through the remote conversion service', () => {
        const file = makeFile('sample.pdf', 'application/pdf');

        expect(chooseLocalOrRemoteConversion(file, 'docx')).toBe('remote');
    });

    it('exposes DOCX as a target for PDF sources', () => {
        expect(getTargetsForSource('pdf')).toEqual(
            expect.arrayContaining(['docx']),
        );
    });

    it('keeps PDF to DOCX metadata available for the warning banner', () => {
        const metadata = getConversionMetadata('pdf', 'docx');

        expect(metadata?.engine).toBe('libreoffice-pdf');
        expect(metadata?.warnings?.join(' ')).toMatch(/PDF to DOCX/i);
    });
});
