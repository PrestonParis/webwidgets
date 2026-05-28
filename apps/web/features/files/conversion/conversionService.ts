import { marked } from 'marked';
import { sanitizeRichText } from '@/features/view/security/contentSecurity';
import {
    fileConversionFormats,
    getFileConversionCapability,
} from '@/features/files/conversion/conversionRegistry';
import type {
    FileConversionFormat,
    TextConversionInput,
} from '@/features/files/types/conversion';

export class FileConversionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileConversionError';
    }
}

export async function convertTextFile({
    input,
    from,
    to,
}: TextConversionInput) {
    const capability = getFileConversionCapability(from, to);

    if (!capability) {
        throw new FileConversionError(
            `No conversion route for ${from} to ${to}.`,
        );
    }

    if (capability.status !== 'available') {
        throw new FileConversionError(
            `${capability.label} needs one of these adapters first: ${capability.adapters.join(', ')}.`,
        );
    }

    if (from === 'md' && to === 'html') {
        return sanitizeRichText(await marked.parse(input));
    }

    if (from === 'html' && to === 'md') {
        return htmlToMarkdown(input);
    }

    if (from === 'md' && to === 'txt') {
        const html = await marked.parse(input);
        return htmlToText(html);
    }

    if (from === 'txt' && to === 'md') {
        return textToMarkdown(input);
    }

    if (from === 'html' && to === 'txt') {
        return htmlToText(input);
    }

    if (from === 'txt' && to === 'html') {
        return textToHtml(input);
    }

    throw new FileConversionError(
        `Conversion for ${from} to ${to} is not wired.`,
    );
}

export function getOutputFilename(filename: string, to: FileConversionFormat) {
    const cleanName = filename.replace(/\.[^/.]+$/, '') || 'converted';
    return `${cleanName}.${fileConversionFormats[to].extension}`;
}

export function getOutputMimeType(to: FileConversionFormat) {
    return fileConversionFormats[to].mimeType;
}

function textToHtml(input: string) {
    return escapeHtml(input)
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('\n');
}

function textToMarkdown(input: string) {
    return input
        .replace(/\r\n/g, '\n')
        .split(/\n{3,}/)
        .map((chunk) => chunk.trimEnd())
        .join('\n\n')
        .trim();
}

function htmlToText(input: string) {
    return decodeEntities(
        input
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(
                /<\/(p|div|section|article|header|footer|li|h[1-6])>/gi,
                '\n',
            )
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
    );
}

function htmlToMarkdown(input: string) {
    return decodeEntities(
        input
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
            .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
            .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
            .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
            .replace(
                /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
                '[$2]($1)',
            )
            .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
            .replace(/<\/(p|div|section|article|header|footer)>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
    );
}

function escapeHtml(input: string) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeEntities(input: string) {
    return input
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
