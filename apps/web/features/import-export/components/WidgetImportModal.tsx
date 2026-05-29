'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { Button } from '@/features/ui/components/Button';
import { useWidgetImportExport } from '@/features/import-export/hooks/useWidgetImportExport';
import type { SourceDestinationType } from '@/features/import-export/types/importExport';
import type { WidgetParseResult } from '@/features/import-export/hooks/useWidgetImportExport';

// Target fields per source type for the mapping step
const TARGET_FIELDS: Partial<Record<SourceDestinationType, string[]>> = {
    tracking_entries: ['category', 'entry_date', 'notes', 'tags', 'source'],
    todos: ['title', 'done', 'due_date', 'notes', 'tags'],
    mood_logs: ['score', 'label', 'notes', 'entry_date'],
    journals: ['title', 'content', 'type', 'created_at'],
    habits: ['name', 'description', 'frequency', 'color'],
    recovery_records: ['addiction', 'start_time', 'notes'],
};

interface Props {
    open: boolean;
    onClose: () => void;
    sourceType: SourceDestinationType;
    displayName: string;
}

type Step = 'upload' | 'map' | 'done';

interface ExecuteResult {
    status: string;
    successCount: number;
    errorCount: number;
    errors: Array<{ rowIndex: number; message: string }>;
}

export function WidgetImportModal({
    open,
    onClose,
    sourceType,
    displayName,
}: Props) {
    const { importing, executing, parseFile, executeImport } =
        useWidgetImportExport(sourceType);

    const [step, setStep] = useState<Step>('upload');
    const [format, setFormat] = useState<'csv' | 'json'>('csv');
    const [duplicateStrategy, setDuplicateStrategy] = useState<
        'skip' | 'overwrite' | 'keep_both'
    >('skip');
    const [parseResult, setParseResult] = useState<WidgetParseResult | null>(
        null,
    );
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const targetFields = TARGET_FIELDS[sourceType] ?? [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'json') setFormat('json');
        else setFormat('csv');
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        const result = await parseFile(selectedFile, format, duplicateStrategy);
        if (!result) return;
        setParseResult(result);
        // Auto-map headers that match target fields exactly
        const auto: Record<string, string> = {};
        for (const header of result.headers) {
            const match = targetFields.find(
                (f) => f.toLowerCase() === header.toLowerCase(),
            );
            if (match) auto[header] = match;
        }
        setMappings(auto);
        setStep('map');
    };

    const handleExecute = async () => {
        if (!parseResult) return;
        const mappingList = Object.entries(mappings)
            .filter(([, v]) => v)
            .map(([sourceColumn, targetField]) => ({
                sourceColumn,
                targetField,
            }));
        const result = await executeImport(
            parseResult.jobId,
            mappingList,
            parseResult.sampleRows,
            duplicateStrategy,
        );
        if (!result) return;
        setExecuteResult(result);
        setStep('done');
    };

    const handleClose = () => {
        setStep('upload');
        setSelectedFile(null);
        setParseResult(null);
        setMappings({});
        setExecuteResult(null);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} size="md">
            <ModalHeader
                title={`Import ${displayName}`}
                description={
                    step === 'upload'
                        ? 'Upload a CSV or JSON file to import data'
                        : step === 'map'
                          ? 'Map file columns to fields'
                          : 'Import complete'
                }
                onClose={handleClose}
            />
            <ModalBody>
                {step === 'upload' && (
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                            {selectedFile ? (
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {selectedFile.name}
                                </p>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        Click to choose a file
                                    </p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                        CSV or JSON
                                    </p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                    Format
                                </label>
                                <select
                                    className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2"
                                    value={format}
                                    onChange={(e) =>
                                        setFormat(
                                            e.target.value as 'csv' | 'json',
                                        )
                                    }
                                >
                                    <option value="csv">CSV</option>
                                    <option value="json">JSON</option>
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
                                        setDuplicateStrategy(
                                            e.target.value as
                                                | 'skip'
                                                | 'overwrite'
                                                | 'keep_both',
                                        )
                                    }
                                >
                                    <option value="skip">
                                        Skip duplicates
                                    </option>
                                    <option value="overwrite">Overwrite</option>
                                    <option value="keep_both">Keep both</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'map' && parseResult && (
                    <div className="space-y-4">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {parseResult.totalRows} rows detected. Map each
                            column to a target field (or leave blank to skip).
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {parseResult.headers.map((header) => (
                                <div
                                    key={header}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-32 truncate shrink-0">
                                        {header}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-zinc-300 shrink-0" />
                                    <select
                                        className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1.5"
                                        value={mappings[header] ?? ''}
                                        onChange={(e) =>
                                            setMappings((m) => ({
                                                ...m,
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
                        {parseResult.sampleRows.length > 0 && (
                            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                                    Preview (first row)
                                </p>
                                <div className="space-y-1">
                                    {parseResult.headers
                                        .slice(0, 4)
                                        .map((h) => (
                                            <div
                                                key={h}
                                                className="flex gap-2 text-xs"
                                            >
                                                <span className="text-zinc-400 w-24 truncate shrink-0">
                                                    {h}:
                                                </span>
                                                <span className="text-zinc-700 dark:text-zinc-300 truncate">
                                                    {parseResult.sampleRows[0]
                                                        ?.raw[h] ?? '—'}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'done' && executeResult && (
                    <div className="space-y-3 text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                            <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            Import complete
                        </p>
                        <p className="text-xs text-zinc-500">
                            {executeResult.successCount} rows imported
                            {executeResult.errorCount > 0
                                ? ` · ${executeResult.errorCount} errors`
                                : ''}
                        </p>
                        {executeResult.errors.length > 0 && (
                            <ul className="text-left text-xs text-red-500 space-y-1 max-h-32 overflow-y-auto">
                                {executeResult.errors
                                    .slice(0, 5)
                                    .map((e, i) => (
                                        <li key={i}>
                                            Row {e.rowIndex}: {e.message}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {step === 'upload' && (
                    <>
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            icon={ArrowRight}
                            loading={importing}
                            disabled={!selectedFile}
                            onClick={() => void handleUpload()}
                        >
                            Parse file
                        </Button>
                    </>
                )}
                {step === 'map' && (
                    <>
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => setStep('upload')}
                        >
                            Back
                        </Button>
                        <Button
                            loading={executing}
                            onClick={() => void handleExecute()}
                        >
                            Import
                        </Button>
                    </>
                )}
                {step === 'done' && <Button onClick={handleClose}>Done</Button>}
            </ModalFooter>
        </Modal>
    );
}
