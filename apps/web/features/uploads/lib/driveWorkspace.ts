import type { DriveFile } from '@/app/api/drive/files/route';

const GOOGLE_MIME_PREFIX = 'application/vnd.google-apps.';

const EDITOR_PATHS: Record<string, string> = {
    document: 'document',
    spreadsheet: 'spreadsheets',
    presentation: 'presentation',
    drawing: 'drawings',
    form: 'forms',
};

export function isEditableGoogleFile(mimeType: string): boolean {
    const kind = mimeType.replace(GOOGLE_MIME_PREFIX, '');
    return kind in EDITOR_PATHS;
}

export function getDriveWorkspaceUrl(file: DriveFile): string {
    const kind = file.mimeType.replace(GOOGLE_MIME_PREFIX, '');
    const editorPath = EDITOR_PATHS[kind];

    if (editorPath) {
        return `https://docs.google.com/${editorPath}/d/${encodeURIComponent(file.id)}/edit?rm=minimal&embedded=true`;
    }

    return `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/preview`;
}
