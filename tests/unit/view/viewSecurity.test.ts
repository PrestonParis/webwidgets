import { describe, expect, it } from 'vitest';
import {
    validateViewFile,
    sanitizeRichText,
    sanitizeSvg,
} from '@/features/view/security/contentSecurity';

const MALICIOUS_SVG = '<svg><script>alert(1)</script><rect /></svg>';

describe('view content security', () => {
    it('rejects oversized files', () => {
        const result = validateViewFile({
            id: 'big',
            name: 'big.txt',
            mimeType: 'text/plain',
            sizeBytes: 30 * 1024 * 1024,
            source: 'upload',
        });
        expect(result.isErr()).toBe(true);
    });

    it('sanitizes script tags from rich text and svg', () => {
        expect(
            sanitizeRichText('<p>Hello</p><script>alert(1)</script>'),
        ).not.toContain('script');
        expect(sanitizeSvg(MALICIOUS_SVG)).not.toContain('script');
    });
});
