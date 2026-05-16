import { describe, it, expect } from 'vitest';
import { tiptapToPreviewText } from '@/lib/utils/tiptap';

describe('tiptapToPreviewText', () => {
    it('returns empty string for empty input', () => {
        expect(tiptapToPreviewText('')).toBe('');
    });

    it('strips basic HTML tags and returns plain text', () => {
        expect(tiptapToPreviewText('<p>Hello world</p>')).toBe('Hello world');
    });

    it('uppercases heading content', () => {
        expect(tiptapToPreviewText('<h1>My Title</h1>')).toBe('MY TITLE');
    });

    it('converts list items to bullet points', () => {
        const html = '<ul><li>Alpha</li><li>Beta</li></ul>';
        const result = tiptapToPreviewText(html);
        expect(result).toContain('• Alpha');
        expect(result).toContain('• Beta');
    });

    it('converts closing p tags to newlines', () => {
        const html = '<p>First</p><p>Second</p>';
        const result = tiptapToPreviewText(html);
        expect(result).toContain('First');
        expect(result).toContain('Second');
    });

    it('collapses multiple consecutive newlines to one', () => {
        const html = '<p>A</p><p>B</p>';
        const result = tiptapToPreviewText(html);
        expect(result).not.toMatch(/\n{2,}/);
    });

    it('trims leading and trailing whitespace', () => {
        const result = tiptapToPreviewText('<p>  text  </p>');
        expect(result.startsWith(' ')).toBe(false);
        expect(result.endsWith(' ')).toBe(false);
    });

    it('handles mixed headings, paragraphs, and lists', () => {
        const html = '<h2>Section</h2><p>Intro</p><li>Item</li>';
        const result = tiptapToPreviewText(html);
        expect(result).toContain('SECTION');
        expect(result).toContain('Intro');
        expect(result).toContain('• Item');
    });
});
