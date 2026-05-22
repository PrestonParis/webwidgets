'use client';

import { useRef } from 'react';
import { FolderOpen, Plus, File, Trash2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useFileUpload } from '@/features/uploads/hooks/useFileUpload';

const MAX_WIDGET_FILES = 5;

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesWidget() {
    const { files, loading, uploadState, upload, remove } = useFileUpload();
    const inputRef = useRef<HTMLInputElement>(null);

    const recent = files.slice(0, MAX_WIDGET_FILES);
    const overflow = Math.max(0, files.length - MAX_WIDGET_FILES);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await upload(file);
        e.target.value = '';
    };

    return (
        <WidgetShell
            icon={<FolderOpen size={16} />}
            title="Files"
            widgetId="files"
            widgetType="files"
            footerHref="/files"
            footerLabel="All files →"
        >
            <div className="space-y-2">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-zinc-400 dark:text-zinc-600">
                        <FolderOpen size={24} className="opacity-40" />
                        <p className="text-xs">No files uploaded yet.</p>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-1.5">
                            {recent.map((f) => (
                                <li
                                    key={f.id}
                                    className="group flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <File
                                        size={13}
                                        className="shrink-0 text-zinc-400"
                                    />
                                    <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                        {f.originalName}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">
                                        {formatBytes(f.sizeBytes)}
                                    </span>
                                    <button
                                        onClick={() => {
                                            void remove(f.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
                                        aria-label="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {overflow > 0 && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center">
                                +{overflow} more
                            </p>
                        )}
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                        void handleFileChange(e);
                    }}
                />
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploadState === 'uploading'}
                    className="w-full text-xs py-1.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={12} />
                    {uploadState === 'uploading' ? 'Uploading…' : 'Upload file'}
                </button>
            </div>
        </WidgetShell>
    );
}
