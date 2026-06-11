import { apiRouteFetch } from '@/lib/api/client';
import type {
    FileUpload,
    PresignResponse,
} from '@/features/uploads/types/upload';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

const presignedUploadUrls = new Map<string, string>();

export async function requestPresignedUrl(
    originalName: string,
    mimeType: string,
    sizeBytes: number,
): Promise<PresignResponse> {
    const res = await apiRouteFetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName, mimeType, sizeBytes }),
    });
    if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to get upload URL');
    }
    const body = (await res.json()) as PresignResponse;
    presignedUploadUrls.set(body.fileId, body.presignedUrl);
    return body;
}

export async function confirmUpload(fileId: string): Promise<FileUpload> {
    const res = await apiRouteFetch(`/api/uploads/${fileId}`, {
        method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to confirm upload');
    clearCachedJson('/api/uploads');
    return res.json() as Promise<FileUpload>;
}

// Upload the file directly to S3 using the presigned URL (bypasses Vercel's
// 4.5 MB body limit — the browser talks to S3 directly, not through the server).
export async function uploadFileToS3(
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                onProgress?.(Math.round((e.loaded / e.total) * 100));
            }
        });
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`S3 upload failed: ${xhr.status}`));
            }
        });
        xhr.addEventListener('error', () =>
            reject(new Error('Upload network error')),
        );
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader(
            'Content-Type',
            file.type || 'application/octet-stream',
        );
        xhr.send(file);
    });
}

export async function uploadFileContent(
    fileId: string,
    file: File,
    onProgress?: (progress: number) => void,
): Promise<FileUpload> {
    const presignedUrl = presignedUploadUrls.get(fileId);
    if (presignedUrl) {
        await uploadFileToS3(presignedUrl, file, onProgress);
        presignedUploadUrls.delete(fileId);
        clearCachedJson('/api/uploads');
        return confirmUpload(fileId);
    }

    const uploaded = await new Promise<FileUpload>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                onProgress?.(Math.round((event.loaded / event.total) * 100));
            }
        });
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText) as FileUpload);
                } catch {
                    reject(new Error('Upload response was not valid JSON'));
                }
            } else {
                reject(new Error(`File upload failed: ${xhr.status}`));
            }
        });
        xhr.addEventListener('error', () =>
            reject(new Error('Upload network error')),
        );
        xhr.open('PUT', `/api/uploads/${fileId}/content`);
        xhr.setRequestHeader(
            'Content-Type',
            file.type || 'application/octet-stream',
        );
        xhr.send(file);
    });

    clearCachedJson('/api/uploads');
    return uploaded;
}

export async function deleteUpload(fileId: string): Promise<void> {
    const res = await apiRouteFetch(`/api/uploads/${fileId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
    clearCachedJson('/api/uploads');
}

export async function listUploads(): Promise<FileUpload[]> {
    const data = await cachedJson<{ files: FileUpload[] }>('/api/uploads', {
        ttlMs: 10_000,
    });
    return data.files;
}
