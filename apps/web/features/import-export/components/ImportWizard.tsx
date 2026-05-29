'use client';

import { useState } from 'react';
import { Upload, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import type {
    ImportWizardProps,
    ImportWizardParseResult,
    ImportWizardExecuteResult,
    ImportJob,
} from '@/features/import-export/types/importExport';

const DESTINATION_FIELDS: Record<string, string[]> = {
    tracking_entries: ['category', 'entry_date', 'notes', 'tags', 'source'],
    todos: ['title', 'done', 'due_date', 'notes', 'tags'],
};

type Step = 1 | 2 | 3;

export function ImportWizard({
    capabilities,
    importJobs,
    onCreateJob,
    onParseJob,
    onExecuteJob,
}: ImportWizardProps) {
    const [step, setStep] = useState<Step>(1);
    const [format, setFormat] = useState('csv');
    const [destinationType, setDestinationType] = useState('tracking_entries');
    const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
    const [content, setContent] = useState('');
    const [filename, setFilename] = useState('');
    const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
    const [parseResult, setParseResult] =
        useState<ImportWizardParseResult | null>(null);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [executeResult, setExecuteResult] =
        useState<ImportWizardExecuteResult | null>(null);
    const [running, setRunning] = useState(false);

    const importableAdapters = capabilities.filter((c) => c.canImport);
    const targetFields = DESTINATION_FIELDS[destinationType] ?? [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFilename(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setContent((ev.target?.result as string) ?? '');
        };
        reader.readAsText(file);
    };

    const handleStep1Next = async () => {
        if (!content.trim()) return;
        setRunning(true);
        const job = await onCreateJob({
            format,
            destination_type: destinationType,
            duplicate_strategy: duplicateStrategy,
            title: `Import ${new Date().toLocaleDateString()}`,
        });
        if (!job) {
            setRunning(false);
            return;
        }
        setCurrentJob(job);

        const result = await onParseJob(job.id, content, filename || undefined);
        setRunning(false);
        if (!result) return;
        setParseResult(result);

        // Auto-map exact header name matches
        const autoMappings: Record<string, string> = {};
        result.headers.forEach((h) => {
            const lh = h.toLowerCase().replace(/[\s-]/g, '_');
            if (targetFields.includes(lh)) autoMappings[h] = lh;
            else if (targetFields.includes(h)) autoMappings[h] = h;
        });
        setMappings(autoMappings);
        setStep(2);
    };

    const handleStep2Next = async () => {
        if (!currentJob || !parseResult) return;
        setRunning(true);
        const fieldMappings = Object.entries(mappings)
            .filter(([, target]) => target)
            .map(([sourceColumn, targetField]) => ({
                sourceColumn,
                targetField,
            }));

        const result = await onExecuteJob(currentJob.id, {
            mappings: fieldMappings,
            duplicate_strategy: duplicateStrategy,
            rows: parseResult.sampleRows,
        });
        setRunning(false);
        if (!result) return;
        setExecuteResult(result);
        setStep(3);
    };

    const handleReset = () => {
        setStep(1);
        setContent('');
        setFilename('');
        setCurrentJob(null);
        setParseResult(null);
        setMappings({});
        setExecuteResult(null);
    };

    return (
        <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {([1, 2, 3] as Step[]).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                step === s
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                    : step > s
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}
                        >
                            {step > s ? <Check size={12} /> : s}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {s === 1
                                ? 'File & Settings'
                                : s === 2
                                  ? 'Map Fields'
                                  : 'Results'}
                        </span>
                        {s < 3 && (
                            <ArrowRight
                                size={12}
                                className="text-zinc-300 dark:text-zinc-600"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: File & Settings */}
            {step === 1 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                Format
                            </label>
                            <select
                                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                            >
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                                <option value="xlsx" disabled>
                                    XLSX (not available)
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                Destination
                            </label>
                            <select
                                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                                value={destinationType}
                                onChange={(e) =>
                                    setDestinationType(e.target.value)
                                }
                            >
                                {importableAdapters.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                Duplicates
                            </label>
                            <select
                                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                                value={duplicateStrategy}
                                onChange={(e) =>
                                    setDuplicateStrategy(e.target.value)
                                }
                            >
                                <option value="skip">Skip duplicates</option>
                                <option value="overwrite">Overwrite</option>
                                <option value="keep_both">Keep both</option>
                                <option value="merge">Merge (beta)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            File upload
                        </label>
                        <input
                            type="file"
                            accept=".csv,.json"
                            onChange={handleFileChange}
                            className="text-sm text-zinc-600 dark:text-zinc-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Or paste content directly
                        </label>
                        <textarea
                            className="w-full h-32 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-2 resize-none"
                            placeholder={
                                'name,category,date\nJohn,health,2026-01-01'
                            }
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            icon={ArrowRight}
                            iconPosition="right"
                            loading={running}
                            disabled={!content.trim()}
                            onClick={() => void handleStep1Next()}
                        >
                            Parse & Preview
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Map Fields */}
            {step === 2 && parseResult && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Found{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                            {parseResult.totalRows}
                        </strong>{' '}
                        rows,{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                            {parseResult.headers.length}
                        </strong>{' '}
                        columns.
                    </div>

                    {/* Sample preview */}
                    {parseResult.sampleRows.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800">
                                        {parseResult.headers.map((h) => (
                                            <th
                                                key={h}
                                                className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parseResult.sampleRows
                                        .slice(0, 3)
                                        .map((row) => (
                                            <tr
                                                key={row.rowIndex}
                                                className="border-t border-zinc-100 dark:border-zinc-800"
                                            >
                                                {parseResult.headers.map(
                                                    (h) => (
                                                        <td
                                                            key={h}
                                                            className="px-3 py-2 text-zinc-700 dark:text-zinc-300 truncate max-w-30"
                                                        >
                                                            {row.raw[h] ?? ''}
                                                        </td>
                                                    ),
                                                )}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Field mapping */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Map source columns to {destinationType} fields
                        </p>
                        {parseResult.headers.map((header) => (
                            <div
                                key={header}
                                className="flex items-center gap-3"
                            >
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 w-32 truncate font-mono">
                                    {header}
                                </span>
                                <ArrowRight
                                    size={12}
                                    className="text-zinc-300 dark:text-zinc-600 shrink-0"
                                />
                                <select
                                    className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1.5"
                                    value={mappings[header] ?? ''}
                                    onChange={(e) =>
                                        setMappings((prev) => ({
                                            ...prev,
                                            [header]: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">(skip)</option>
                                    {targetFields.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between">
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => setStep(1)}
                        >
                            Back
                        </Button>
                        <Button
                            icon={Upload}
                            loading={running}
                            onClick={() => void handleStep2Next()}
                        >
                            Execute Import
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {step === 3 && executeResult && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-full ${
                                executeResult.errorCount === 0
                                    ? 'bg-emerald-100 dark:bg-emerald-950/30'
                                    : 'bg-amber-100 dark:bg-amber-950/30'
                            }`}
                        >
                            {executeResult.errorCount === 0 ? (
                                <Check size={16} className="text-emerald-600" />
                            ) : (
                                <Upload size={16} className="text-amber-600" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Import{' '}
                                {executeResult.status === 'completed'
                                    ? 'Complete'
                                    : 'Completed with warnings'}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {executeResult.successCount} succeeded ·{' '}
                                {executeResult.errorCount} failed ·{' '}
                                {executeResult.warningCount} warnings
                            </p>
                        </div>
                    </div>

                    {executeResult.errors.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-red-600 mb-1">
                                Errors:
                            </p>
                            <ul className="text-xs text-red-500 space-y-0.5 max-h-32 overflow-y-auto">
                                {executeResult.errors
                                    .slice(0, 10)
                                    .map((e, i) => (
                                        <li key={i}>
                                            Row {e.rowIndex}: {e.message}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}

                    {executeResult.warnings.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-amber-600 mb-1">
                                Warnings:
                            </p>
                            <ul className="text-xs text-amber-500 space-y-0.5 max-h-24 overflow-y-auto">
                                {executeResult.warnings
                                    .slice(0, 10)
                                    .map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                            </ul>
                        </div>
                    )}

                    <Button variant="secondary" onClick={handleReset}>
                        Import Another File
                    </Button>
                </div>
            )}

            {/* Job history */}
            {importJobs.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                        Recent Import Jobs
                    </h3>
                    <div className="space-y-2">
                        {importJobs.slice(0, 8).map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                        {job.title ?? job.id.slice(0, 8)}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {job.format} → {job.destinationType} ·{' '}
                                        {job.rowCount != null
                                            ? `${job.rowCount} rows`
                                            : 'no rows'}{' '}
                                        · {job.successCount} ok /{' '}
                                        {job.errorCount} err
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
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
