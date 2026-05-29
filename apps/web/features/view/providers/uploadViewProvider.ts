import type { FileUpload } from '@/features/uploads/types/upload';
import type { ViewFileRef } from '@/features/view/schemas/objectSchemas';
import type { ViewFile } from '@/features/view/types/viewFile';

export function uploadToViewFile(upload: FileUpload): ViewFileRef {
    return {
        id: upload.id,
        name: upload.originalName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        source: 'upload',
        createdAt: upload.createdAt,
    };
}

/** Convert a ViewFile (full model) to the ViewFileRef needed by viewStore / parsers */
export function viewFileToRef(file: ViewFile): ViewFileRef {
    return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        source: 'upload',
        createdAt: file.uploadedAt,
    };
}

export function uploadToViewFileFull(upload: FileUpload): ViewFile {
    const ext = upload.originalName.includes('.')
        ? upload.originalName
              .slice(upload.originalName.lastIndexOf('.') + 1)
              .toLowerCase()
        : '';

    return {
        id: upload.id,
        userId: upload.userId,
        name: upload.originalName,
        extension: ext,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        s3Key: upload.s3Key,
        folderId: null,
        sourceType: 'upload',
        sourceLabel: 'Uploaded',
        uploadedAt: upload.createdAt,
        updatedAt: upload.updatedAt,
        lastOpenedAt: null,
        previewStatus: 'none',
        tags: [],
        notes: null,
        favorite: false,
        archived: false,
        deletedAt: null,
    };
}
