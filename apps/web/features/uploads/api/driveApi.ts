import type { DriveFile } from '@/app/api/drive/files/route';

export interface DriveFilesResult {
    connected: boolean;
    files: DriveFile[];
}

export async function listDriveFiles(
    query?: string,
): Promise<DriveFilesResult> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const res = await fetch(`/api/drive/files?${params.toString()}`);
    if (!res.ok) return { connected: false, files: [] };
    return res.json() as Promise<DriveFilesResult>;
}
