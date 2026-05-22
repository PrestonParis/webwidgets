'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { UploadState } from '@/features/uploads/hooks/useFileUpload';

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

interface FileUploadZoneProps {
    uploadState: UploadState;
    uploadProgress: number;
    uploadError: string | null;
    onUpload: (file: File) => Promise<void>;
}

function ProgressBar({ progress }: { progress: number }) {
    return (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
                className="h-full rounded-full bg-[#4f6ef7] transition-all duration-200"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export function FileUploadZone({
    uploadState,
    uploadProgress,
    uploadError,
    onUpload,
}: FileUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = useCallback(
        (file: File) => {
            if (file.size > MAX_SIZE_BYTES) {
                alert('File exceeds 100 MB limit.');
                return;
            }
            void onUpload(file);
        },
        [onUpload],
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (inputRef.current) inputRef.current.value = '';
        },
        [handleFile],
    );

    const busy = uploadState === 'uploading';

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => !busy && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                disabled={busy}
                className={cn(
                    'flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
                    dragging
                        ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                        : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600',
                    busy && 'cursor-not-allowed opacity-60',
                )}
            >
                <Upload className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
                <div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {busy
                            ? `Uploading… ${uploadProgress}%`
                            : 'Click or drag a file to upload'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Up to 100 MB per file
                    </p>
                </div>
                {busy && <ProgressBar progress={uploadProgress} />}
            </button>

            {uploadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <X className="h-4 w-4 shrink-0" />
                    {uploadError}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={onInputChange}
            />
        </div>
    );
}
