'use client';

import { File, Loader2, Search, Trash2 } from 'lucide-react';
import type { FileUpload } from '@/features/uploads/types/upload';
import type { UploadTask } from '@/features/uploads/hooks/useFileUpload';

interface FileListProps {
    files: FileUpload[];
    tasks: UploadTask[];
    search: string;
    onSearch: (value: string) => void;
    onOpen: (file: FileUpload) => void;
    onRemove: (fileId: string) => Promise<void>;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
        ? 'Today'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fileType(file: FileUpload): string {
    const extension = file.originalName.split('.').pop();
    return extension && extension !== file.originalName
        ? extension.toUpperCase()
        : file.mimeType.split('/').pop()?.toUpperCase() || 'FILE';
}

export function FileList({
    files,
    tasks,
    search,
    onSearch,
    onOpen,
    onRemove,
}: FileListProps) {
    const filtered = files.filter((file) =>
        file.originalName.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <Search size={15} className="text-zinc-400" />
                <input
                    value={search}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder="Search files…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <File className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {search ? 'No matching files' : 'No files yet'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                        {search
                            ? 'Try a different search term.'
                            : 'Upload a PDF, document, image, or text file to preview it here.'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400 dark:bg-zinc-950/50">
                            <tr>
                                <th className="px-4 py-2 font-semibold">
                                    Name
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Type
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Size
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Status
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Updated
                                </th>
                                <th className="w-12 px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filtered.map((file) => {
                                const task = tasks.find(
                                    (item) => item.fileId === file.id,
                                );
                                const processing =
                                    task?.status === 'processing';
                                const statusLabel =
                                    task?.status === 'failed'
                                        ? 'Failed'
                                        : task?.status === 'uploaded'
                                          ? 'Uploaded'
                                          : processing
                                            ? 'Processing'
                                            : 'Ready';
                                return (
                                    <tr
                                        key={file.id}
                                        className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                        onClick={() => onOpen(file)}
                                    >
                                        <td className="max-w-xs px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <File className="h-4 w-4 shrink-0 text-blue-500" />
                                                <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                                                    {file.originalName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-zinc-500">
                                            {fileType(file)}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-zinc-500">
                                            {formatBytes(file.sizeBytes)}
                                        </td>
                                        <td className="px-3 py-3 text-xs">
                                            <span className="inline-flex items-center gap-1.5 text-zinc-500">
                                                {processing && (
                                                    <Loader2
                                                        size={12}
                                                        className="animate-spin"
                                                    />
                                                )}
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-zinc-500">
                                            {formatDate(file.updatedAt)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                type="button"
                                                title="Delete file"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void onRemove(file.id);
                                                }}
                                                className="rounded-md p-1.5 text-zinc-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
