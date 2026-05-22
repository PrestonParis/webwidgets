'use client';

import { useState } from 'react';
import { HardDrive, ExternalLink, Search, X } from 'lucide-react';
import { useDriveFiles } from '@/features/uploads/hooks/useDriveFiles';
import { connectAvailableProvider } from '@/features/onboarding/lib/integrationRegistry';
import type { DriveFile } from '@/app/api/drive/files/route';

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

function DriveFileRow({ file }: { file: DriveFile }) {
    return (
        <a
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
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
            <ExternalLink
                size={14}
                className="shrink-0 text-zinc-300 group-hover:text-blue-400 dark:text-zinc-600 dark:group-hover:text-blue-400 transition-colors"
            />
        </a>
    );
}

export function DriveFileBrowser() {
    const [search, setSearch] = useState('');
    const { connected, files, loading } = useDriveFiles(search || undefined);

    const handleConnect = async () => {
        await connectAvailableProvider('google-drive');
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
                        Browse and view your Drive files without leaving the
                        dashboard.
                    </p>
                </div>
                <button
                    onClick={() => {
                        void handleConnect();
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
                        <DriveFileRow key={f.id} file={f} />
                    ))}
                </div>
            )}
        </div>
    );
}
