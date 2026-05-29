'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { ViewFileRef } from '@/features/view/schemas/objectSchemas';
import { useViewFiles } from '@/features/view/hooks/useViewFiles';
import { getFileIcon } from '@/features/view/lib/fileIcons';
import {
    requestPresignedUrl,
    uploadFileContent,
} from '@/features/uploads/api/uploadApi';

function viewFileToRef(file: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
}): ViewFileRef {
    return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        source: 'upload',
        createdAt: file.uploadedAt,
    };
}

export function ViewFileBrowser({
    activeFileId,
    onSelect,
}: {
    activeFileId?: string;
    onSelect: (file: ViewFileRef) => void;
}) {
    const { data: files = [], isLoading, isError } = useViewFiles();
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const { fileId } = await requestPresignedUrl(
                file.name,
                file.type || 'application/octet-stream',
                file.size,
            );
            await uploadFileContent(fileId, file);
            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : 'Upload failed',
            );
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
            <div className="border-b border-zinc-800 p-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Files
                </p>
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    title="Upload file"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition disabled:opacity-50"
                >
                    {uploading ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <Upload size={13} />
                    )}
                    {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                        void handleFileChange(e);
                    }}
                />
            </div>
            {uploadError && (
                <p className="px-3 py-1 text-[10px] text-red-400 bg-red-950/20">
                    {uploadError}
                </p>
            )}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading && (
                    <p className="p-3 text-xs text-zinc-500">
                        Loading files...
                    </p>
                )}
                {isError && (
                    <p className="p-3 text-xs text-red-400">
                        Could not load files.
                    </p>
                )}
                {files.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    return (
                        <button
                            key={file.id}
                            onClick={() => onSelect(viewFileToRef(file))}
                            className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition ${activeFileId === file.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                                {file.name}
                            </span>
                        </button>
                    );
                })}
                {!isLoading && files.length === 0 && (
                    <div className="p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-2">
                            No files yet.
                        </p>
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="text-xs text-[#4f6ef7] hover:text-[#7b93f9] transition-colors"
                        >
                            Upload your first file →
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
