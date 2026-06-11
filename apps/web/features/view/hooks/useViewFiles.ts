'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { uploadToViewFileFull } from '@/features/view/providers/uploadViewProvider';
import type { FileUpload } from '@/features/uploads/types/upload';

async function fetchFiles() {
    const response = await apiRouteFetch('/api/uploads');
    if (!response.ok) throw new Error('Failed to load files');
    const data = (await response.json()) as { files: FileUpload[] };
    return data.files.map(uploadToViewFileFull);
}

export function useViewFiles() {
    return useQuery({
        queryKey: ['view-files'],
        queryFn: fetchFiles,
        staleTime: 60_000,
    });
}
