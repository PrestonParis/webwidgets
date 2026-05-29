'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
    requestPresignedUrl,
    uploadFileContent,
} from '@/features/uploads/api/uploadApi';

interface UploadProgress {
    name: string;
    progress: number;
    done: boolean;
    error: string | null;
}

interface ViewUploadZoneProps {
    children?: React.ReactNode;
    /** If true, renders as a standalone empty-state drop zone rather than an overlay */
    standalone?: boolean;
    className?: string;
}

export function ViewUploadZone({
    children,
    standalone = false,
    className = '',
}: ViewUploadZoneProps) {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);

    const handleFiles = useCallback(
        async (files: FileList) => {
            const fileArr = Array.from(files);
            const initial: UploadProgress[] = fileArr.map((f) => ({
                name: f.name,
                progress: 0,
                done: false,
                error: null,
            }));
            setUploads((prev) => [...prev, ...initial]);

            await Promise.allSettled(
                fileArr.map(async (file, idx) => {
                    const globalIdx = uploads.length + idx;
                    const updateEntry = (patch: Partial<UploadProgress>) => {
                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === globalIdx ? { ...u, ...patch } : u,
                            ),
                        );
                    };
                    try {
                        const { fileId } = await requestPresignedUrl(
                            file.name,
                            file.type || 'application/octet-stream',
                            file.size,
                        );
                        await uploadFileContent(fileId, file, (progress) => {
                            updateEntry({ progress });
                        });
                        updateEntry({ progress: 100, done: true });
                    } catch (err) {
                        updateEntry({
                            error:
                                err instanceof Error
                                    ? err.message
                                    : 'Upload failed',
                            done: true,
                        });
                    }
                }),
            );

            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
            // Clear completed after a brief delay
            setTimeout(() => {
                setUploads((prev) => prev.filter((u) => u.error !== null));
            }, 2000);
        },
        [queryClient, uploads.length],
    );

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const onDragLeave = () => setIsDragOver(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            void handleFiles(e.dataTransfer.files);
        }
    };
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            void handleFiles(e.target.files);
            e.target.value = '';
        }
    };

    if (standalone) {
        return (
            <div
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${isDragOver ? 'border-indigo-500 bg-indigo-950/20' : 'border-zinc-700 bg-zinc-900/40'} ${className}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <Upload size={28} className="text-zinc-500" />
                <div>
                    <p className="text-sm font-medium text-zinc-300">
                        Drop files here or
                    </p>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        click to upload
                    </button>
                </div>
                <p className="text-xs text-zinc-600">
                    Any file type, up to 100 MB
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onInputChange}
                />
                {uploads.length > 0 && (
                    <ProgressList
                        uploads={uploads}
                        onDismiss={(i) =>
                            setUploads((p) => p.filter((_, idx) => idx !== i))
                        }
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative ${className}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {children}
            {isDragOver && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-950/40">
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={32} className="text-indigo-400" />
                        <p className="text-sm font-semibold text-indigo-300">
                            Drop to upload
                        </p>
                    </div>
                </div>
            )}
            {uploads.length > 0 && (
                <div className="absolute bottom-4 right-4 z-40 w-72">
                    <ProgressList
                        uploads={uploads}
                        onDismiss={(i) =>
                            setUploads((p) => p.filter((_, idx) => idx !== i))
                        }
                    />
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onInputChange}
            />
        </div>
    );
}

function ProgressList({
    uploads,
    onDismiss,
}: {
    uploads: UploadProgress[];
    onDismiss: (i: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {uploads.map((u, i) => (
                <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-zinc-800/90 px-3 py-2 text-xs shadow-lg backdrop-blur"
                >
                    {u.done && !u.error ? null : u.done ? null : (
                        <Loader2
                            size={12}
                            className="shrink-0 animate-spin text-indigo-400"
                        />
                    )}
                    <span className="min-w-0 flex-1 truncate text-zinc-300">
                        {u.name}
                    </span>
                    {!u.done && (
                        <span className="shrink-0 tabular-nums text-zinc-500">
                            {u.progress}%
                        </span>
                    )}
                    {u.error && (
                        <span className="shrink-0 text-red-400">Error</span>
                    )}
                    {u.done && (
                        <button
                            onClick={() => onDismiss(i)}
                            className="shrink-0 text-zinc-500 hover:text-zinc-300"
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
