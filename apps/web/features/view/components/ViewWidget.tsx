'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Download, Trash2, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useViewFiles } from '@/features/view/hooks/useViewFiles';
import { getFileIcon } from '@/features/view/lib/fileIcons';
import { formatFileSize } from '@/features/view/lib/formatFileSize';
import {
    requestPresignedUrl,
    uploadFileContent,
    deleteUpload,
} from '@/features/uploads/api/uploadApi';
import { viewFileToRef } from '@/features/view/providers/uploadViewProvider';
import { useViewStore } from '@/features/view/state/viewStore';
import type { ViewFile } from '@/features/view/types/viewFile';

const MAX_WIDGET_FILES = 6;

export default function ViewWidget({
    widgetId = 'view',
}: {
    widgetId?: string;
}) {
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const setActiveFile = useViewStore((s) => s.setActiveFile);

    const { data: files = [], isLoading, isError, refetch } = useViewFiles();
    const recentFiles = files.slice(0, MAX_WIDGET_FILES);

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const doUpload = async (file: File) => {
        setUploadProgress(0);
        setUploadError(null);
        try {
            const { fileId } = await requestPresignedUrl(
                file.name,
                file.type || 'application/octet-stream',
                file.size,
            );
            await uploadFileContent(fileId, file, (p) => setUploadProgress(p));
            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : 'Upload failed',
            );
        } finally {
            setUploadProgress(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) void doUpload(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void doUpload(file);
    };

    const handleDelete = async (file: ViewFile) => {
        try {
            await deleteUpload(file.id);
            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
        } catch {
            // ignore
        }
    };

    const handleDownload = async (file: ViewFile) => {
        try {
            const res = await fetch(`/api/uploads/${file.id}/download`);
            if (!res.ok) return;
            const { downloadUrl } = (await res.json()) as {
                downloadUrl: string;
            };
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch {
            // ignore
        }
    };

    const handleOpen = (file: ViewFile) => {
        setActiveFile(viewFileToRef(file));
        // Navigate will happen from the footer link or user clicks "Open workspace"
    };

    return (
        <WidgetShell
            icon={<Eye size={16} />}
            title="Files"
            widgetId={widgetId}
            widgetType="view"
            footerHref="/view"
            footerLabel="Open View workspace →"
        >
            <div
                className={`relative mt-2 min-h-45 rounded-xl border-2 transition-colors ${isDragOver ? 'border-dashed border-indigo-500 bg-indigo-950/20' : 'border-transparent'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Upload progress bar */}
                {uploadProgress !== null && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
                        <Loader2
                            size={13}
                            className="animate-spin text-indigo-500 shrink-0"
                        />
                        <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-[10px] tabular-nums text-zinc-500">
                            {uploadProgress}%
                        </span>
                    </div>
                )}

                {uploadError && (
                    <p className="mb-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs text-red-500">
                        {uploadError}
                    </p>
                )}

                {/* Loading skeletons */}
                {isLoading && (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 animate-pulse"
                            >
                                <div className="h-4 w-4 rounded bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                                <div className="flex-1 h-3 rounded bg-zinc-300 dark:bg-zinc-700" />
                                <div className="h-3 w-10 rounded bg-zinc-300 dark:bg-zinc-700" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                        <p className="text-xs text-red-500">
                            Could not load files
                        </p>
                        <button
                            onClick={() => void refetch()}
                            className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* File list */}
                {!isLoading && !isError && recentFiles.length > 0 && (
                    <div className="space-y-1">
                        {recentFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <div
                                    key={file.id}
                                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                                >
                                    <Icon
                                        size={14}
                                        className="shrink-0 text-zinc-400 dark:text-zinc-500"
                                    />
                                    <button
                                        onClick={() => handleOpen(file)}
                                        className="min-w-0 flex-1 text-left"
                                    >
                                        <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                                            {file.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 tabular-nums">
                                            {formatFileSize(file.sizeBytes)}
                                        </p>
                                    </button>
                                    <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                                        <button
                                            onClick={() =>
                                                void handleDownload(file)
                                            }
                                            title="Download"
                                            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            <Download size={11} />
                                        </button>
                                        <Link
                                            href={`/view?fileId=${file.id}`}
                                            title="Open"
                                            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            <ExternalLink size={11} />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                void handleDelete(file)
                                            }
                                            title="Delete"
                                            className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !isError && files.length === 0 && (
                    <div
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-colors ${isDragOver ? 'border-indigo-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                    >
                        <p className="text-xs text-zinc-500">
                            Drop files here or
                        </p>
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                            click to upload
                        </button>
                        <Link
                            href="/view"
                            className="mt-1 text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                        >
                            Open View workspace →
                        </Link>
                    </div>
                )}

                {/* Drag-over overlay text */}
                {isDragOver && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
                        <p className="text-sm font-semibold text-indigo-400">
                            Drop to upload
                        </p>
                    </div>
                )}
            </div>

            {/* Upload button */}
            {!isLoading && !isError && files.length > 0 && (
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploadProgress !== null}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 disabled:opacity-50 transition-colors"
                >
                    {uploadProgress !== null ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : null}
                    {uploadProgress !== null
                        ? `Uploading… ${uploadProgress}%`
                        : 'Upload a file'}
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleInputChange}
            />
        </WidgetShell>
    );
}
