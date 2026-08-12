import { describe, expect, it } from 'vitest';
import type { OneDriveFile } from '@/app/api/onedrive/files/route';
import {
    getOneDriveWorkspaceUrl,
    isEditableOfficeFile,
} from '@/features/uploads/lib/oneDriveWorkspace';

function file(
    mimeType: string,
    webUrl = 'https://example.sharepoint.com/a.docx',
) {
    return {
        id: 'one-drive-id',
        name: 'Document.docx',
        mimeType,
        size: 42,
        modifiedTime: '2026-08-05T00:00:00.000Z',
        webUrl,
    } satisfies OneDriveFile;
}

describe('OneDrive workspace', () => {
    it('opens Word files in edit mode', () => {
        const item = file(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );

        expect(isEditableOfficeFile(item)).toBe(true);
        expect(getOneDriveWorkspaceUrl(item)).toBe(
            'https://example.sharepoint.com/a.docx?web=1&action=edit',
        );
    });

    it('opens other files in web preview mode', () => {
        const item = file('application/pdf', 'https://example.com/file.pdf');

        expect(isEditableOfficeFile(item)).toBe(false);
        expect(getOneDriveWorkspaceUrl(item)).toBe(
            'https://example.com/file.pdf?web=1',
        );
    });
});
