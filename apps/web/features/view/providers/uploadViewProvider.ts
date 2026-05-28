import type { FileUpload } from '@/features/uploads/types/upload';
import type { ViewFileRef } from '@/features/view/schemas/objectSchemas';

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
