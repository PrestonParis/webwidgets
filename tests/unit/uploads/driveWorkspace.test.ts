import { describe, expect, it } from 'vitest';
import type { DriveFile } from '@/app/api/drive/files/route';
import {
    getDriveWorkspaceUrl,
    isEditableGoogleFile,
} from '@/features/uploads/lib/driveWorkspace';

function file(mimeType: string): DriveFile {
    return {
        id: 'drive file/id',
        name: 'Example',
        mimeType,
        modifiedTime: '',
        size: '0',
        webViewLink: 'https://drive.google.com/open?id=drive-file-id',
        iconLink: '',
    };
}

describe('Drive workspace URLs', () => {
    it.each([
        ['document', 'document'],
        ['spreadsheet', 'spreadsheets'],
        ['presentation', 'presentation'],
        ['drawing', 'drawings'],
        ['form', 'forms'],
    ])('opens Google %s files in their live editor', (kind, path) => {
        const driveFile = file(`application/vnd.google-apps.${kind}`);

        expect(isEditableGoogleFile(driveFile.mimeType)).toBe(true);
        expect(getDriveWorkspaceUrl(driveFile)).toBe(
            `https://docs.google.com/${path}/d/drive%20file%2Fid/edit?rm=minimal&embedded=true`,
        );
    });

    it('uses the Drive preview for non-Google files', () => {
        const driveFile = file(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );

        expect(isEditableGoogleFile(driveFile.mimeType)).toBe(false);
        expect(getDriveWorkspaceUrl(driveFile)).toBe(
            'https://drive.google.com/file/d/drive%20file%2Fid/preview',
        );
    });
});
