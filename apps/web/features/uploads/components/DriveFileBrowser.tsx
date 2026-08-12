'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Eye, HardDrive, Pencil, Search, X } from 'lucide-react';
import { useDriveFiles } from '@/features/uploads/hooks/useDriveFiles';
import type { DriveFile } from '@/app/api/drive/files/route';
import {
    getDriveWorkspaceUrl,
    isEditableGoogleFile,
} from '@/features/uploads/lib/driveWorkspace';

function formatBytes(bytes: string): string {
    const n = parseInt(bytes, 10) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function mimeLabel(mime: string): string {
    if (mime.includes('document')) return 'Doc';
    if (mime.includes('spreadsheet')) return 'Sheet';
    if (mime.includes('presentation')) return 'Slides';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('folder')) return 'Folder';
    if (mime.includes('image')) return 'Image';
    return 'File';
}

function DriveFileRow({
    file,
    onOpen,
}: {
    file: DriveFile;
    onOpen: (file: DriveFile) => void;
}) {
    const editable = isEditableGoogleFile(file.mimeType);

    return (
        <button
            type="button"
            onClick={() => onOpen(file)}
            className="group flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/10"
        >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {mimeLabel(file.mimeType)}
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {file.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {file.size !== '0' ? `${formatBytes(file.size)} · ` : ''}
                    {formatDate(file.modifiedTime)}
                </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors group-hover:text-blue-500 dark:text-zinc-500">
                {editable ? <Pencil size={13} /> : <Eye size={13} />}
                <span className="hidden sm:inline">
                    {editable ? 'Edit in webwidgets' : 'View in webwidgets'}
                </span>
            </span>
        </button>
    );
}

function DriveWorkspace({
    file,
    onClose,
}: {
    file: DriveFile;
    onClose: () => void;
}) {
    const editable = isEditableGoogleFile(file.mimeType);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
            <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-4 text-zinc-100">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                        {editable
                            ? 'Live Google editor · changes save to Drive'
                            : 'Google Drive preview'}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {file.webViewLink && (
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                            Open in Google
                            <ArrowUpRight size={14} />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Drive workspace"
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>
            <div className="min-h-0 flex-1 bg-white">
                <iframe
                    key={file.id}
                    src={getDriveWorkspaceUrl(file)}
                    title={`${editable ? 'Edit' : 'Preview'} ${file.name}`}
                    className="h-full w-full border-0"
                    allow="clipboard-read; clipboard-write; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        </div>
    );
}

export function DriveFileBrowser() {
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const { connected, files, loading } = useDriveFiles(search || undefined);

    const handleConnect = () => {
        window.location.assign(
            '/api/auth/google/start?redirect=/files&service=drive',
        );
    };

    if (!connected && !loading) {
        return (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <HardDrive size={20} className="text-blue-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                        Connect Google Drive
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Open and work on Drive files without leaving webwidgets.
                    </p>
                </div>
                <button
                    onClick={() => {
                        handleConnect();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    Connect Google Drive
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 transition-colors">
                <Search size={14} className="text-zinc-400 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Drive files…"
                    className="flex-1 text-sm bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 bg-zinc-50 dark:bg-zinc-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <p className="text-sm text-center text-zinc-400 dark:text-zinc-600 py-8">
                    {search
                        ? `No files matching "${search}"`
                        : 'No files found in Drive.'}
                </p>
            ) : (
                <div className="space-y-2">
                    {files.map((f) => (
                        <DriveFileRow
                            key={f.id}
                            file={f}
                            onOpen={setSelectedFile}
                        />
                    ))}
                </div>
            )}

            {selectedFile && (
                <DriveWorkspace
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
}
