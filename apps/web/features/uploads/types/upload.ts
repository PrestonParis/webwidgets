export type UploadStatus = 'pending' | 'uploaded' | 'deleted';

export interface FileUpload {
    id: string;
    userId: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    s3Key: string;
    status: UploadStatus;
    createdAt: string;
    updatedAt: string;
}

export interface PresignResponse {
    fileId: string;
    presignedUrl: string;
    key: string;
}

export type FileUploadRow = {
    id: string;
    user_id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    s3_key: string;
    status: string;
    created_at: string;
    updated_at: string;
};

export function rowToFileUpload(row: FileUploadRow): FileUpload {
    return {
        id: row.id,
        userId: row.user_id,
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        s3Key: row.s3_key,
        status: row.status as UploadStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
