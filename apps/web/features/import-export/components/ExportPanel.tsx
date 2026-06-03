'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import type { ExportPanelProps } from '@/features/import-export/types/importExport';

function downloadFile(
    content: string,
    filename: string,
    contentType: string,
    encoding?: string,
) {
    let blobSource: BlobPart;
    if (encoding === 'base64') {
        const binaryString = atob(content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        blobSource = bytes;
    } else {
        blobSource = content;
    }
    const blob = new Blob([blobSource], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, string> = {
    ready: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    failed: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    requested: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    collecting: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
};

export function ExportPanel({
    capabilities,
    exportJobs,
    onExport,
}: ExportPanelProps) {
    const exportableAdapters = capabilities.filter((c) => c.canExport);
    const [sourceType, setSourceType] = useState(
        exportableAdapters[0]?.id ?? 'tracking_entries',
    );
    const [format, setFormat] = useState('json');
    const [running, setRunning] = useState(false);
    const [lastWarnings, setLastWarnings] = useState<string[]>([]);

    const selectedAdapter = exportableAdapters.find((a) => a.id === sourceType);
    const availableFormats = selectedAdapter?.exportFormats ?? ['json', 'csv'];

    const handleExport = async () => {
        setRunning(true);
        setLastWarnings([]);
        const result = await onExport({ source_type: sourceType, format });
        if (result) {
            setLastWarnings(result.warnings);
            downloadFile(
                result.download.content,
                result.download.filename,
                result.download.contentType,
                result.download.encoding,
            );
        }
        setRunning(false);
    };

    return (
        <div className="space-y-5">
            {/* Create export */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Generate Export
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Data Source
                        </label>
                        <select
                            className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                            value={sourceType}
                            onChange={(e) => {
                                setSourceType(e.target.value);
                                const adapter = exportableAdapters.find(
                                    (a) => a.id === e.target.value,
                                );
                                const formats = adapter?.exportFormats ?? [
                                    'json',
                                ];
                                if (!formats.includes(format as never)) {
                                    setFormat(formats[0] ?? 'json');
                                }
                            }}
                        >
                            {exportableAdapters.length === 0 ? (
                                <option value="">No adapters available</option>
                            ) : (
                                exportableAdapters.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.displayName}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Format
                        </label>
                        <select
                            className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            {availableFormats.map((f) => (
                                <option key={f} value={f}>
                                    {f.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {lastWarnings.length > 0 && (
                    <ul className="mb-3 text-xs text-amber-600 space-y-1">
                        {lastWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                        ))}
                    </ul>
                )}
                <Button
                    icon={Download}
                    loading={running}
                    onClick={() => void handleExport()}
                    disabled={exportableAdapters.length === 0}
                >
                    Export & Download
                </Button>
            </div>

            {/* Export history */}
            {exportJobs.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                        Recent Exports
                    </h3>
                    <div className="space-y-2">
                        {exportJobs.slice(0, 10).map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                        {job.title}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {job.sourceType} · {job.format} ·{' '}
                                        {job.rowCount != null
                                            ? `${job.rowCount} rows`
                                            : 'processing'}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? 'text-zinc-600 bg-zinc-100'}`}
                                >
                                    {job.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
