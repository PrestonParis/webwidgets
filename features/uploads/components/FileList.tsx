'use client';

import { File, Trash2 } from 'lucide-react';
import type { FileUpload } from '@/features/uploads/types/upload';

interface FileListProps {
    files: FileUpload[];
    onRemove: (fileId: string) => Promise<void>;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function FileRow({
    file,
    onRemove,
}: {
    file: FileUpload;
    onRemove: () => void;
}) {
    return (
        <div className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <File className="h-5 w-5 shrink-0 text-zinc-400" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {file.originalName}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                </p>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Delete file"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}

export function FileList({ files, onRemove }: FileListProps) {
    if (files.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
                No files uploaded yet.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {files.map((file) => (
                <FileRow
                    key={file.id}
                    file={file}
                    onRemove={() => {
                        void onRemove(file.id);
                    }}
                />
            ))}
        </div>
    );
}
