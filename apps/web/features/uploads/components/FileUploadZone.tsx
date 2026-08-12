'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, RotateCcw, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { UploadTask } from '@/features/uploads/hooks/useFileUpload';

interface FileUploadZoneProps {
    compact?: boolean;
    tasks: UploadTask[];
    onUpload: (files: File[]) => Promise<void>;
    onRetry: (taskId: string) => Promise<void>;
}

export function FileUploadZone({
    compact = false,
    tasks,
    onUpload,
    onRetry,
}: FileUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const acceptFiles = useCallback(
        (list: FileList | null) => {
            const files = Array.from(list ?? []);
            if (files.length > 0) void onUpload(files);
        },
        [onUpload],
    );

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    acceptFiles(event.dataTransfer.files);
                }}
                className={cn(
                    'flex w-full items-center justify-center border border-dashed text-center transition-colors',
                    compact
                        ? 'gap-2 rounded-xl px-4 py-3'
                        : 'flex-col gap-3 rounded-2xl px-6 py-8',
                    dragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-zinc-300 bg-zinc-50 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900',
                )}
            >
                <Upload className="h-5 w-5 text-blue-500" />
                <div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        Upload files
                    </p>
                    {!compact && (
                        <p className="mt-1 text-xs text-zinc-400">
                            Click or drag one or more files · up to 100 MB each
                        </p>
                    )}
                </div>
            </button>

            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                    console.info('file-upload', {
                        stage: 'validation',
                        selectedCount: event.target.files?.length ?? 0,
                        source: 'input',
                    });
                    acceptFiles(event.target.files);
                    event.target.value = '';
                }}
            />

            {tasks.length > 0 && (
                <div className="space-y-2">
                    {tasks.slice(0, 6).map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                'rounded-xl border px-3 py-2 text-xs',
                                task.status === 'failed'
                                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {task.status === 'failed' && (
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                                )}
                                <span className="min-w-0 flex-1 truncate font-medium text-zinc-700 dark:text-zinc-200">
                                    {task.fileName}
                                </span>
                                <span className="capitalize text-zinc-400">
                                    {task.status}
                                </span>
                                {task.status === 'failed' && (
                                    <button
                                        type="button"
                                        onClick={() => void onRetry(task.id)}
                                        className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700"
                                    >
                                        <RotateCcw size={12} /> Retry
                                    </button>
                                )}
                            </div>
                            {task.status === 'uploading' && (
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-[width]"
                                        style={{ width: `${task.progress}%` }}
                                    />
                                </div>
                            )}
                            {task.error && (
                                <p className="mt-1 break-words text-red-600 dark:text-red-400">
                                    {task.error}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
