'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileUpload } from '@/features/uploads/types/upload';
import {
    requestPresignedUrl,
    uploadFileToS3,
    uploadFileViaServer,
    confirmUpload,
    deleteUpload,
    listUploads,
} from '@/features/uploads/api/uploadApi';

export type UploadStage =
    | 'validation'
    | 'storage'
    | 'database'
    | 'processing'
    | 'refresh';
export type UploadStatus =
    | 'uploading'
    | 'uploaded'
    | 'processing'
    | 'ready'
    | 'failed';

export interface UploadTask {
    id: string;
    file: File;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath?: string | undefined;
    fileId?: string | undefined;
    stage: UploadStage;
    status: UploadStatus;
    progress: number;
    error?: string | undefined;
}

const MAX_SIZE_BYTES = 100 * 1024 * 1024;

function reportUpload(
    task: Pick<
        UploadTask,
        | 'stage'
        | 'fileName'
        | 'fileSize'
        | 'mimeType'
        | 'storagePath'
        | 'fileId'
    >,
    error?: unknown,
) {
    const detail = {
        stage: task.stage,
        fileName: task.fileName,
        fileSize: task.fileSize,
        mimeType: task.mimeType,
        storagePath: task.storagePath ?? null,
        fileId: task.fileId ?? null,
        error:
            error instanceof Error
                ? error.message
                : error === undefined
                  ? null
                  : String(error),
    };
    if (error) console.error('file-upload', detail);
    else console.info('file-upload', detail);
}

export function useFileUpload() {
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [tasks, setTasks] = useState<UploadTask[]>([]);
    const [loading, setLoading] = useState(true);
    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;

    const updateTask = useCallback(
        (id: string, patch: Partial<UploadTask>) =>
            setTasks((current) =>
                current.map((task) =>
                    task.id === id ? { ...task, ...patch } : task,
                ),
            ),
        [],
    );

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listUploads();
            setFiles(result);
        } catch (error) {
            reportUpload(
                {
                    stage: 'refresh',
                    fileName: '',
                    fileSize: 0,
                    mimeType: '',
                },
                error,
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void reload(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [reload]);

    const runUpload = useCallback(
        async (task: UploadTask) => {
            let current = task;
            try {
                if (task.file.size === 0 || task.file.size > MAX_SIZE_BYTES) {
                    throw new Error(
                        task.file.size === 0
                            ? 'The selected file is empty.'
                            : 'File exceeds the 100 MB limit.',
                    );
                }

                current = { ...current, stage: 'database' };
                updateTask(task.id, {
                    stage: 'database',
                    status: 'uploading',
                    progress: 2,
                    error: undefined,
                });
                reportUpload(current);
                const presign = await requestPresignedUrl(
                    task.fileName,
                    task.mimeType,
                    task.fileSize,
                );

                current = {
                    ...current,
                    stage: 'storage',
                    storagePath: presign.key,
                    fileId: presign.fileId,
                };
                updateTask(task.id, current);
                reportUpload(current);
                let confirmed: FileUpload | null = null;
                try {
                    await uploadFileToS3(
                        presign.presignedUrl,
                        task.file,
                        (progress) => updateTask(task.id, { progress }),
                    );
                } catch (storageError) {
                    if (
                        !(storageError instanceof Error) ||
                        storageError.message !== 'Upload network error'
                    ) {
                        throw storageError;
                    }
                    console.warn('file-upload', {
                        stage: 'storage',
                        fileName: task.fileName,
                        fileId: presign.fileId,
                        storagePath: presign.key,
                        fallback: 'server',
                    });
                    confirmed = await uploadFileViaServer(
                        presign.fileId,
                        task.file,
                        (progress) => updateTask(task.id, { progress }),
                    );
                }

                current = { ...current, stage: 'database' };
                updateTask(task.id, { stage: 'database', progress: 100 });
                confirmed ??= await confirmUpload(presign.fileId);
                setFiles((existing) => [
                    confirmed,
                    ...existing.filter((file) => file.id !== confirmed.id),
                ]);
                updateTask(task.id, {
                    status: 'processing',
                    stage: 'processing',
                });

                // Extraction can continue asynchronously; the persisted file is
                // already visible and safe to refresh at this point.
                void fetch(`/api/uploads/${presign.fileId}/extract`, {
                    method: 'POST',
                })
                    .then(async (response) => {
                        const result = (await response.json()) as {
                            available?: boolean;
                            reason?: string;
                        };
                        if (!response.ok) {
                            throw new Error(
                                result.reason ?? 'File processing failed.',
                            );
                        }
                        updateTask(task.id, {
                            status:
                                result.available === false
                                    ? 'uploaded'
                                    : 'ready',
                            stage: 'refresh',
                        });
                    })
                    .catch((processingError: unknown) => {
                        reportUpload(
                            { ...current, stage: 'processing' },
                            processingError,
                        );
                        updateTask(task.id, {
                            status: 'failed',
                            stage: 'processing',
                            error:
                                processingError instanceof Error
                                    ? processingError.message
                                    : 'File processing failed.',
                        });
                    });
            } catch (error) {
                reportUpload(current, error);
                // Presign creates the pending database row before bytes are sent.
                // Roll back both the row and any partially/successfully written
                // object when a later stage fails, preventing hidden orphans.
                if (current.fileId) {
                    try {
                        await deleteUpload(current.fileId);
                    } catch (cleanupError) {
                        reportUpload(current, cleanupError);
                    }
                }
                updateTask(task.id, {
                    status: 'failed',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Upload failed unexpectedly.',
                });
            }
        },
        [updateTask],
    );

    const upload = useCallback(
        async (selected: File[] | File) => {
            const selectedFiles = Array.isArray(selected)
                ? selected
                : [selected];
            const newTasks = selectedFiles.map<UploadTask>((file) => ({
                id: crypto.randomUUID(),
                file,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                stage: 'validation',
                status: 'uploading',
                progress: 0,
            }));
            setTasks((current) => [...newTasks, ...current]);
            await Promise.allSettled(newTasks.map(runUpload));
        },
        [runUpload],
    );

    const retry = useCallback(
        async (taskId: string) => {
            const task = tasksRef.current.find((item) => item.id === taskId);
            if (!task) return;
            updateTask(task.id, {
                stage: 'validation',
                status: 'uploading',
                progress: 0,
                error: undefined,
                fileId: undefined,
                storagePath: undefined,
            });
            await runUpload({
                ...task,
                stage: 'validation',
                status: 'uploading',
                progress: 0,
                error: undefined,
                fileId: undefined,
                storagePath: undefined,
            });
        },
        [runUpload, updateTask],
    );

    const remove = useCallback(async (fileId: string) => {
        await deleteUpload(fileId);
        setFiles((current) => current.filter((file) => file.id !== fileId));
    }, []);

    const activeTask = tasks.find((task) => task.status === 'uploading');
    const failedTask = tasks.find((task) => task.status === 'failed');

    return {
        files,
        tasks,
        loading,
        upload,
        retry,
        remove,
        reload,
        // Compatibility for the compact dashboard widget.
        uploadState: activeTask ? ('uploading' as const) : ('idle' as const),
        uploadProgress: activeTask?.progress ?? 0,
        uploadError: failedTask?.error ?? null,
    };
}
