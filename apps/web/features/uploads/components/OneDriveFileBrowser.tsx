'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Cloud, Eye, Pencil, Search, X } from 'lucide-react';
import type { OneDriveFile } from '@/app/api/onedrive/files/route';
import { apiRouteFetch } from '@/lib/api/client';
import { useOneDriveFiles } from '@/features/uploads/hooks/useOneDriveFiles';
import {
    getOneDriveWorkspaceUrl,
    isEditableOfficeFile,
} from '@/features/uploads/lib/oneDriveWorkspace';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(file: OneDriveFile): string {
    const extension = file.name.split('.').pop();
    return extension && extension !== file.name
        ? extension.toUpperCase().slice(0, 5)
        : 'File';
}

function OneDriveWorkspace({
    file,
    onClose,
}: {
    file: OneDriveFile;
    onClose: () => void;
}) {
    const editable = isEditableOfficeFile(file);
    const [workspaceUrl, setWorkspaceUrl] = useState('');
    const [workspaceMode, setWorkspaceMode] = useState<
        'loading' | 'edit' | 'preview' | 'fallback'
    >('loading');
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    useEffect(() => {
        let active = true;
        void apiRouteFetch(`/api/onedrive/files/${file.id}/workspace`, {
            method: 'POST',
        })
            .then(async (response) => {
                const body = (await response.json()) as {
                    url?: string;
                    mode?: 'edit' | 'preview';
                    error?: string;
                };
                if (!active) return;
                if (response.ok && body.url && body.mode) {
                    setWorkspaceUrl(body.url);
                    setWorkspaceMode(body.mode);
                    return;
                }
                setWorkspaceUrl(getOneDriveWorkspaceUrl(file));
                setWorkspaceMode('fallback');
                setWorkspaceError(body.error ?? 'Embedded view unavailable');
            })
            .catch(() => {
                if (!active) return;
                setWorkspaceUrl(getOneDriveWorkspaceUrl(file));
                setWorkspaceMode('fallback');
                setWorkspaceError('Embedded view unavailable');
            });
        return () => {
            active = false;
        };
    }, [file]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
            <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-4 text-zinc-100">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                        {workspaceMode === 'edit'
                            ? 'Microsoft 365 editor · changes save to OneDrive'
                            : workspaceMode === 'loading'
                              ? 'Opening Microsoft 365…'
                              : 'OneDrive preview'}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <a
                        href={file.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        Open in Microsoft 365 <ArrowUpRight size={14} />
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close OneDrive workspace"
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>
            {workspaceMode === 'loading' ? (
                <div className="grid flex-1 place-items-center bg-white text-sm text-zinc-500">
                    Preparing your Microsoft 365 workspace…
                </div>
            ) : workspaceUrl ? (
                <iframe
                    src={workspaceUrl}
                    title={`${editable ? 'Edit' : 'Preview'} ${file.name}`}
                    className="min-h-0 flex-1 border-0 bg-white"
                    allow="clipboard-read; clipboard-write; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            ) : (
                <div className="grid flex-1 place-items-center text-sm text-zinc-400">
                    Microsoft did not return a URL for this file.
                </div>
            )}
            {workspaceError && workspaceMode === 'fallback' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-900/95 px-4 py-2 text-xs text-zinc-300 shadow-xl">
                    {workspaceError} Use “Open in Microsoft 365” if the embedded
                    view is blocked by your tenant.
                </div>
            )}
        </div>
    );
}

export function OneDriveFileBrowser() {
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<OneDriveFile | null>(null);
    const { connected, files, loading, error } = useOneDriveFiles(
        search || undefined,
    );

    if (!connected && !loading) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-900/20">
                    <Cloud size={21} className="text-sky-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Connect OneDrive
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        Browse and work on Word, Excel, and PowerPoint files in
                        webwidgets.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs text-red-500">{error}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() =>
                        window.location.assign(
                            '/api/auth/microsoft/start?redirect=/files',
                        )
                    }
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                    Connect OneDrive
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-sky-400 dark:border-zinc-700 dark:bg-zinc-800">
                <Search size={14} className="shrink-0 text-zinc-400" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search OneDrive files…"
                    className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear OneDrive search"
                        className="text-zinc-400 hover:text-zinc-200"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                        />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                    {search
                        ? `No OneDrive files matching “${search}”`
                        : 'No recent files found in OneDrive.'}
                </p>
            ) : (
                <div className="space-y-2">
                    {files.map((file) => {
                        const editable = isEditableOfficeFile(file);
                        return (
                            <button
                                key={file.id}
                                type="button"
                                onClick={() => setSelectedFile(file)}
                                className="group flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3 text-left hover:border-sky-300 hover:bg-sky-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-800"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[10px] font-bold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                    {fileLabel(file)}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                        {formatBytes(file.size)} ·{' '}
                                        {file.modifiedTime
                                            ? new Date(
                                                  file.modifiedTime,
                                              ).toLocaleDateString()
                                            : 'Unknown date'}
                                    </span>
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 group-hover:text-sky-500">
                                    {editable ? (
                                        <Pencil size={13} />
                                    ) : (
                                        <Eye size={13} />
                                    )}
                                    <span className="hidden sm:inline">
                                        {editable ? 'Edit' : 'Preview'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedFile && (
                <OneDriveWorkspace
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
}
