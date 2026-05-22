export function tiptapToPreviewText(html: string) {
    if (!html) return '';

    return html
        .replace(
            /<h[1-6]>(.*?)<\/h[1-6]>/g,
            (_match: string, title: string) => `\n${title.toUpperCase()}\n`,
        )
        .replace(/<li>(.*?)<\/li>/g, '• $1\n')
        .replace(/<\/p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
}
