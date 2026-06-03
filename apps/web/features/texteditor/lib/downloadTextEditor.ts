export const textEditorDownloadFormats = [
    { value: 'docx', label: 'DOCX' },
    { value: 'pdf', label: 'PDF' },
    { value: 'rtf', label: 'RTF' },
    { value: 'odt', label: 'ODT' },
    { value: 'epub', label: 'EPUB' },
    { value: 'html', label: 'HTML' },
    { value: 'md', label: 'Markdown' },
    { value: 'txt', label: 'Plain text' },
] as const;

export type TextEditorDownloadFormat =
    (typeof textEditorDownloadFormats)[number]['value'];

export async function downloadTextEditorDocument({
    format,
    html,
    title,
}: {
    format: TextEditorDownloadFormat;
    html: string;
    title: string;
}) {
    const response = await fetch('/api/texteditor/download-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, html, title }),
    });

    if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        throw new Error(
            (body as { error?: string } | null)?.error ??
                'Could not export this document.',
        );
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') ?? '';
    const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        `${safeFilename(title)}.${format}`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
    return (
        value
            .trim()
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'texteditor-document'
    );
}
