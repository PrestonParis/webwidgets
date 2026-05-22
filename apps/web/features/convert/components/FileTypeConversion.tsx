'use client';

import { useMemo, useState } from 'react';
import { Download, FileUp, Loader2 } from 'lucide-react';
import {
    defaultFileConversion,
    fileConversionFormatOrder,
    fileConversionFormats,
    getFileConversionTargets,
    getPreferredTarget,
    inferFileConversionFormat,
} from '@/features/files/conversion/conversionRegistry';
import type {
    FileConversionCapability,
    FileConversionFormat,
} from '@/features/files/conversion/types';
import { cn } from '@/lib/utils/utils';

const selectClass =
    'h-10 rounded-xl border border-gray-200 bg-white px-3 font-sans text-sm text-gray-800 outline-none transition-colors focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

type FileTypeConversionProps = {
    compact?: boolean;
};

export function FileTypeConversion({ compact }: FileTypeConversionProps) {
    const [fromFormat, setFromFormat] = useState<FileConversionFormat>(
        defaultFileConversion.from,
    );
    const [toFormat, setToFormat] = useState<FileConversionFormat>(
        defaultFileConversion.to,
    );
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const targets = useMemo(
        () => getFileConversionTargets(fromFormat),
        [fromFormat],
    );
    const selectedCapability = targets.find(
        (capability) => capability.to === toFormat,
    );

    const handleFromChange = (format: FileConversionFormat) => {
        setFromFormat(format);
        setToFormat(getPreferredTarget(format));
        setStatus(null);
    };

    const handleFileChange = (nextFile: File | null) => {
        setFile(nextFile);

        if (!nextFile) return;

        const inferredFormat = inferFileConversionFormat(nextFile);
        setFromFormat(inferredFormat);
        setToFormat(getPreferredTarget(inferredFormat));
        setStatus(
            inferredFormat === 'unknown'
                ? 'File type was not recognized, so the source was set to Other file type.'
                : null,
        );
    };

    const handleConvert = async () => {
        if (!file) {
            setStatus('Choose a file first.');
            return;
        }

        if (!selectedCapability || selectedCapability.status !== 'available') {
            setStatus(
                selectedCapability?.notes ?? 'That route needs an adapter.',
            );
            return;
        }

        setIsConverting(true);
        setStatus(null);

        try {
            const formData = new FormData();
            formData.set('file', file);
            formData.set('fromFormat', fromFormat);
            formData.set('toFormat', toFormat);

            const response = await fetch('/api/files/convert', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.error ?? 'File conversion failed.');
            }

            const blob = await response.blob();
            const disposition =
                response.headers.get('content-disposition') ?? '';
            const filename =
                disposition.match(/filename="([^"]+)"/)?.[1] ??
                `converted.${fileConversionFormats[toFormat].extension}`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            setStatus(`Converted ${file.name} to ${filename}.`);
        } catch (error) {
            setStatus(
                error instanceof Error
                    ? error.message
                    : 'File conversion failed.',
            );
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div
            className={cn(
                'rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
                compact &&
                    'rounded-none border-0 bg-transparent p-0 shadow-none dark:bg-transparent',
                'font-sans',
            )}
        >
            <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">File Type Conversion</h3>
            </div>

            <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    File
                    <input
                        type="file"
                        onChange={(event) =>
                            handleFileChange(event.target.files?.[0] ?? null)
                        }
                        className="block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 font-sans text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:font-sans file:text-xs file:font-semibold file:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                    />
                </label>

                <div
                    className={cn(
                        'grid gap-3',
                        compact ? 'grid-cols-1' : 'sm:grid-cols-2',
                    )}
                >
                    <label className="grid gap-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                        From
                        <select
                            value={fromFormat}
                            onChange={(event) =>
                                handleFromChange(
                                    event.target.value as FileConversionFormat,
                                )
                            }
                            className={selectClass}
                        >
                            {fileConversionFormatOrder.map((format) => (
                                <option key={format} value={format}>
                                    {fileConversionFormats[format].label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                        To
                        <select
                            value={toFormat}
                            onChange={(event) =>
                                setToFormat(
                                    event.target.value as FileConversionFormat,
                                )
                            }
                            className={selectClass}
                        >
                            {targets.map((capability) => (
                                <TargetOption
                                    key={`${capability.from}-${capability.to}`}
                                    capability={capability}
                                />
                            ))}
                        </select>
                    </label>
                </div>

                {selectedCapability && (
                    <p className="text-xs leading-5 text-gray-500 dark:text-zinc-400">
                        {selectedCapability.status === 'available'
                            ? selectedCapability.notes
                            : `${selectedCapability.notes} Adapters: ${selectedCapability.adapters.join(', ')}.`}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleConvert}
                    disabled={isConverting || !selectedCapability || !file}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                >
                    {isConverting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Convert
                </button>

                {status && (
                    <p className="text-xs leading-5 text-gray-600 dark:text-zinc-300">
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
}

function TargetOption({
    capability,
}: {
    capability: FileConversionCapability;
}) {
    return (
        <option value={capability.to}>
            {fileConversionFormats[capability.to].label}
            {capability.status !== 'available' ? ' - adapter needed' : ''}
        </option>
    );
}
