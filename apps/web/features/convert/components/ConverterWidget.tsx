'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, FileCog, Loader2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { ConversionDropzone } from '@/features/convert/components/ConversionDropzone';
import {
    useConversionJobs,
    type JobEntry,
} from '@/features/convert/hooks/useConversionJobs';
import {
    createConversionJob,
    startConversionJob,
    uploadConversionInput,
} from '@/features/convert/lib/conversionClient';
import {
    chooseLocalOrRemoteConversion,
    getTargetsForSource,
    inferExtension,
} from '@/features/convert/lib/localConversionPolicy';
import {
    getConversionMetadata,
    isConversionExtension,
    type ConversionExtension,
} from '@/features/convert/types/conversion';

interface ConverterWidgetProps {
    fullPage?: boolean | undefined;
}

export default function ConverterWidget({ fullPage }: ConverterWidgetProps) {
    if (fullPage) return <ConverterCore fullPage />;
    return <ConverterWidgetShell />;
}

function ConverterWidgetShell() {
    const { settings, updateSettings } = useWidgetSettings(
        'converter',
        'converter',
    );
    return (
        <WidgetShell
            icon={<FileCog />}
            title="File Converter"
            badge="Convert"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="converter"
            widgetType="converter"
            footerHref="/convert"
            footerLabel="View full page"
        >
            <ConverterCore />
        </WidgetShell>
    );
}

function ConverterCore({ fullPage }: ConverterWidgetProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [targetExtension, setTargetExtension] =
        useState<ConversionExtension>('pdf');
    const [manualTargets, setManualTargets] = useState(false);
    const [fileTargets, setFileTargets] = useState<
        Record<string, ConversionExtension>
    >({});
    const [busy, setBusy] = useState(false);
    const { entries, initEntries, updateEntry } = useConversionJobs();

    const firstFile = files[0] ?? null;
    const sourceExtensions = useMemo(
        () => Array.from(new Set(files.map((file) => inferExtension(file)))),
        [files],
    );
    const hasMixedSourceTypes = sourceExtensions.length > 1;
    const usePerFileTargets = hasMixedSourceTypes || manualTargets;
    const sourceExtension = hasMixedSourceTypes
        ? 'mixed'
        : firstFile
          ? inferExtension(firstFile)
          : 'unknown';
    const targets = useMemo(
        () => getTargetsForSource(sourceExtension),
        [sourceExtension],
    );
    const conversionMetadata = useMemo(
        () => getConversionMetadata(sourceExtension, targetExtension),
        [sourceExtension, targetExtension],
    );
    const perFileWarnings = useMemo(() => {
        if (!usePerFileTargets) return [];
        return files.flatMap((file, index) => {
            const source = inferExtension(file);
            const target = getTargetForFile(file, index, fileTargets);
            const metadata = getConversionMetadata(source, target);
            return metadata?.warnings?.[0] ?? metadata?.notes ?? [];
        });
    }, [fileTargets, files, usePerFileTargets]);

    const handleFilesChange = (nextFiles: File[]) => {
        setFiles(nextFiles);
        initEntries([]);
        const nextTargets: Record<string, ConversionExtension> = {};
        nextFiles.forEach((file, index) => {
            const [preferredTarget] = getTargetsForSource(inferExtension(file));
            if (preferredTarget)
                nextTargets[fileKey(file, index)] = preferredTarget;
        });
        setFileTargets(nextTargets);
        if (nextFiles.length === 0) {
            setManualTargets(false);
            return;
        }
        const [preferredTarget] = getTargetsForSource(
            inferExtension(nextFiles[0]!),
        );
        if (preferredTarget) setTargetExtension(preferredTarget);
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setBusy(true);
        initEntries(files, (file, index) =>
            usePerFileTargets
                ? getTargetForFile(file, index, fileTargets)
                : targetExtension,
        );

        await Promise.allSettled(
            files.map(async (file, index) => {
                const srcExt = inferExtension(file);
                const selectedTarget = usePerFileTargets
                    ? getTargetForFile(file, index, fileTargets)
                    : targetExtension;
                const placement = chooseLocalOrRemoteConversion(
                    file,
                    selectedTarget,
                );

                if (!isConversionExtension(srcExt)) {
                    updateEntry(index, { error: 'Source type not supported.' });
                    return;
                }
                if (placement === 'unsupported') {
                    updateEntry(index, {
                        error: 'Conversion route not supported.',
                    });
                    return;
                }

                try {
                    if (placement === 'local') {
                        const localUrl = await runLocalConversion(
                            file,
                            selectedTarget,
                        );
                        updateEntry(index, { localUrl });
                        return;
                    }

                    const created = await createConversionJob({
                        originalFileName: file.name,
                        sourceMime: file.type || 'application/octet-stream',
                        sourceExtension: srcExt,
                        targetExtension: selectedTarget,
                        fileSizeBytes: file.size,
                    });
                    if (!created.uploadUrl)
                        throw new Error('No upload URL returned.');
                    await uploadConversionInput(file, created.uploadUrl);
                    const startedJob = await startConversionJob(created.jobId);
                    updateEntry(index, { job: startedJob });
                } catch (err) {
                    updateEntry(index, {
                        error:
                            err instanceof Error
                                ? err.message
                                : 'Conversion failed.',
                    });
                }
            }),
        );

        setBusy(false);
    };

    return (
        <div
            className={
                fullPage
                    ? 'mx-auto grid w-full max-w-3xl gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950'
                    : 'grid gap-3'
            }
        >
            <ConversionDropzone
                files={files}
                onFilesChange={handleFilesChange}
            />

            <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    Source
                    <input
                        value={sourceExtension}
                        readOnly
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </label>
                {!usePerFileTargets && (
                    <label className="grid gap-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                        Target
                        <select
                            value={targetExtension}
                            onChange={(event) =>
                                setTargetExtension(
                                    event.target.value as ConversionExtension,
                                )
                            }
                            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                            {targets.map((target) => (
                                <option key={target} value={target}>
                                    {target.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {files.length > 1 && !hasMixedSourceTypes && (
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    <input
                        type="checkbox"
                        checked={manualTargets}
                        onChange={(event) =>
                            setManualTargets(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-zinc-900"
                    />
                    Select target for each file
                </label>
            )}

            {usePerFileTargets && files.length > 0 && (
                <ul className="grid gap-2">
                    {files.map((file, index) => {
                        const source = inferExtension(file);
                        const fileTarget = getTargetForFile(
                            file,
                            index,
                            fileTargets,
                        );
                        const fileTargetOptions = getTargetsForSource(source);
                        return (
                            <li
                                key={fileKey(file, index)}
                                className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-[1fr_auto_auto]"
                            >
                                <span className="min-w-0 truncate font-medium text-gray-700 dark:text-zinc-300">
                                    {file.name}
                                </span>
                                <span className="text-gray-500 dark:text-zinc-400">
                                    {source.toUpperCase()}
                                </span>
                                <select
                                    value={fileTarget}
                                    onChange={(event) =>
                                        setFileTargets((prev) => ({
                                            ...prev,
                                            [fileKey(file, index)]: event.target
                                                .value as ConversionExtension,
                                        }))
                                    }
                                    className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    {fileTargetOptions.map((target) => (
                                        <option key={target} value={target}>
                                            {target.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button
                type="button"
                onClick={() => {
                    void handleConvert();
                }}
                disabled={busy || files.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
                {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileCog className="h-4 w-4" />
                )}
                {files.length > 1 ? `Convert ${files.length} files` : 'Convert'}
            </button>

            {!usePerFileTargets &&
                (conversionMetadata?.warnings?.length ||
                    conversionMetadata?.notes) && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                        {conversionMetadata.warnings?.[0] ??
                            conversionMetadata.notes}
                    </div>
                )}

            {usePerFileTargets && perFileWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    {Array.from(new Set(perFileWarnings))[0]}
                </div>
            )}

            {entries.length > 0 && (
                <ul className="grid gap-1.5">
                    {entries.map((entry, index) => (
                        <li
                            key={`${entry.file.name}-${index}`}
                            className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <span className="min-w-0 flex-1 truncate font-medium text-gray-700 dark:text-zinc-300">
                                {entry.file.name}
                            </span>
                            <EntryStatus
                                entry={entry}
                                targetExtension={
                                    entry.targetExtension ?? targetExtension
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function fileKey(file: File, index: number) {
    return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function getTargetForFile(
    file: File,
    index: number,
    fileTargets: Record<string, ConversionExtension>,
) {
    const existingTarget = fileTargets[fileKey(file, index)];
    if (existingTarget) return existingTarget;
    return getTargetsForSource(inferExtension(file))[0] ?? 'pdf';
}

function EntryStatus({
    entry,
    targetExtension,
}: {
    entry: JobEntry;
    targetExtension: string;
}) {
    if (entry.error) {
        return (
            <span className="flex shrink-0 items-center gap-1 text-red-600 dark:text-red-400">
                <CircleAlert className="h-3.5 w-3.5" />
                {entry.error}
            </span>
        );
    }

    const downloadUrl = entry.localUrl ?? entry.downloadUrl;
    if (downloadUrl) {
        const baseName = entry.file.name.replace(/\.[^.]+$/, '');
        return (
            <a
                href={downloadUrl}
                download={`${baseName}.${targetExtension}`}
                {...(entry.downloadUrl
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                className="flex shrink-0 items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Download
            </a>
        );
    }

    const statusLabel = entry.job ? entry.job.status : 'uploading…';
    return (
        <span className="flex shrink-0 items-center gap-1 text-gray-400 dark:text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {statusLabel}
        </span>
    );
}

async function runLocalConversion(
    file: File,
    targetExtension: ConversionExtension,
) {
    const source = inferExtension(file);
    const text = await file.text();
    let output = text;
    let mime = 'text/plain;charset=utf-8';

    if (source === 'md' && targetExtension === 'html') {
        output = markdownToHtml(text);
        mime = 'text/html;charset=utf-8';
    } else if (targetExtension === 'txt') {
        output = stripHtml(text).replace(/[#*_`>]/g, '');
    } else if (targetExtension === 'md') {
        output = stripHtml(text);
        mime = 'text/markdown;charset=utf-8';
    } else if (targetExtension === 'html') {
        output = `<pre>${escapeHtml(text)}</pre>`;
        mime = 'text/html;charset=utf-8';
    }

    return URL.createObjectURL(new Blob([output], { type: mime }));
}

function markdownToHtml(markdown: string) {
    return markdown
        .split(/\n{2,}/)
        .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`)
        .join('\n');
}

function stripHtml(value: string) {
    return value.replace(/<[^>]+>/g, '').trim();
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}
