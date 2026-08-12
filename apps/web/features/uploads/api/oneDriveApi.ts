import { apiRouteFetch } from '@/lib/api/client';
import type { OneDriveFile } from '@/app/api/onedrive/files/route';

export interface OneDriveFilesResult {
    connected: boolean;
    files: OneDriveFile[];
    error?: string;
}

export async function listOneDriveFiles(
    query?: string,
): Promise<OneDriveFilesResult> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const response = await apiRouteFetch(
        `/api/onedrive/files?${params.toString()}`,
    );
    const body = (await response.json()) as OneDriveFilesResult;
    return response.ok
        ? body
        : { connected: false, files: [], error: body.error ?? 'Load failed' };
}
