'use client';

import { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ConversionDropzoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export function ConversionDropzone({ files, onFilesChange }: ConversionDropzoneProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const single = files.length === 1 ? (files[0] ?? null) : null;
        if (single?.type.startsWith('image/')) {
            const url = URL.createObjectURL(single);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
        return undefined;
    }, [files]);

    return (
        <div className="grid gap-2">
            <label className="grid cursor-pointer gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-700 transition-colors hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="mx-auto max-h-32 max-w-full rounded-lg object-contain"
                    />
                )}
                <span className="flex items-center gap-2 font-semibold">
                    <Upload className="h-4 w-4 text-amber-500" />
                    {files.length === 0
                        ? 'Choose files'
                        : `${files.length} file${files.length > 1 ? 's' : ''} selected — click to change`}
                </span>
                {files.length === 0 && (
                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                        Small Markdown, HTML, and text can run locally. Office, PDF, and
                        image routes use the conversion service.
                    </span>
                )}
                <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                        onFilesChange(Array.from(event.target.files ?? []));
                        event.target.value = '';
                    }}
                />
            </label>

            {files.length > 0 && (
                <ul className="grid gap-1">
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                            <span className="min-w-0 flex-1 truncate">{file.name}</span>
                            <span className="shrink-0 text-gray-400 dark:text-zinc-500">
                                {formatBytes(file.size)}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    onFilesChange(files.filter((_, i) => i !== index))
                                }
                                className="shrink-0 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
