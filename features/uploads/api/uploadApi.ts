import type {
    FileUpload,
    PresignResponse,
} from '@/features/uploads/types/upload';

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
    return res.json() as Promise<FileUpload>;
}

export async function deleteUpload(fileId: string): Promise<void> {
    const res = await fetch(`/api/uploads/${fileId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
}

export async function listUploads(): Promise<FileUpload[]> {
    const res = await fetch('/api/uploads');
    if (!res.ok) throw new Error('Failed to list files');
    const data = (await res.json()) as { files: FileUpload[] };
    return data.files;
}
