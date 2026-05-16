export interface GmailPart {
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailPart[];
}

export function decodeBase64Url(data: string): string {
    return Buffer.from(
        data.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
    ).toString('utf-8');
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

export function extractText(part: GmailPart): string {
    if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
        const plain = part.parts.find(
            (c) => c.mimeType === 'text/plain' && c.body?.data,
        );
        if (plain?.body?.data) return decodeBase64Url(plain.body.data);
        for (const child of part.parts) {
            const text = extractText(child);
            if (text) return text;
        }
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
        return stripHtml(decodeBase64Url(part.body.data));
    }
    return '';
}
