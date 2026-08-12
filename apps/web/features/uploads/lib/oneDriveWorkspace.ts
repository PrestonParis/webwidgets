import type { OneDriveFile } from '@/app/api/onedrive/files/route';

const OFFICE_MIME_PARTS = [
    'wordprocessingml',
    'spreadsheetml',
    'presentationml',
    'msword',
    'ms-excel',
    'ms-powerpoint',
];

export function isEditableOfficeFile(file: OneDriveFile): boolean {
    return OFFICE_MIME_PARTS.some((part) => file.mimeType.includes(part));
}

export function getOneDriveWorkspaceUrl(file: OneDriveFile): string {
    if (!file.webUrl) return '';
    const url = new URL(file.webUrl);
    url.searchParams.set('web', '1');
    if (isEditableOfficeFile(file)) url.searchParams.set('action', 'edit');
    return url.toString();
}
