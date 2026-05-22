'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FileUpload } from '@/features/uploads/types/upload';
import {
    requestPresignedUrl,
    confirmUpload,
    deleteUpload,
    listUploads,
} from '@/features/uploads/api/uploadApi';

export type UploadState = 'idle' | 'uploading' | 'error';

interface UseFileUploadReturn {
    files: FileUpload[];
    uploadState: UploadState;
    uploadProgress: number;
    uploadError: string | null;
    loading: boolean;
    upload: (file: File) => Promise<void>;
    remove: (fileId: string) => Promise<void>;
    reload: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const reload = useCallback(() => {
        setLoading(true);
        listUploads()
            .then(setFiles)
            .catch((err: unknown) => {
                const msg =
                    err instanceof Error ? err.message : 'Failed to load files';
                setUploadError(msg);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const upload = useCallback(async (file: File) => {
        setUploadState('uploading');
        setUploadProgress(0);
        setUploadError(null);

        try {
            const { fileId, presignedUrl } = await requestPresignedUrl(
                file.name,
                file.type || 'application/octet-stream',
                file.size,
            );

            const xhr = new XMLHttpRequest();
            await new Promise<void>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(
                            Math.round((e.loaded / e.total) * 100),
                        );
                    }
                });
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error(`S3 upload failed: ${xhr.status}`));
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

            const confirmed = await confirmUpload(fileId);
            setFiles((prev) => [confirmed, ...prev]);
            setUploadState('idle');
            setUploadProgress(0);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setUploadError(msg);
            setUploadState('error');
        }
    }, []);

    const remove = useCallback(async (fileId: string) => {
        await deleteUpload(fileId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    return {
        files,
        uploadState,
        uploadProgress,
        uploadError,
        loading,
        upload,
        remove,
        reload,
    };
}
