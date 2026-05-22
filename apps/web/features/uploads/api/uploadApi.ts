import type {
    FileUpload,
    PresignResponse,
} from '@/features/uploads/types/upload';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export async function requestPresignedUrl(
    originalName: string,
    mimeType: string,
    sizeBytes: number,
): Promise<PresignResponse> {
    const res = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName, mimeType, sizeBytes }),
    });
    if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to get upload URL');
    }
    return res.json() as Promise<PresignResponse>;
}

export async function confirmUpload(fileId: string): Promise<FileUpload> {
    const res = await fetch(`/api/uploads/${fileId}`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to confirm upload');
    clearCachedJson('/api/uploads');
    return res.json() as Promise<FileUpload>;
}

export async function deleteUpload(fileId: string): Promise<void> {
    const res = await fetch(`/api/uploads/${fileId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
    clearCachedJson('/api/uploads');
}

export async function listUploads(): Promise<FileUpload[]> {
    const data = await cachedJson<{ files: FileUpload[] }>('/api/uploads', {
        ttlMs: 10_000,
    });
    return data.files;
}
