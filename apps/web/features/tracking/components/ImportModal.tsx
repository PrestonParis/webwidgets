'use client';

import { useCallback } from 'react';
import { useImport } from '@/features/tracking/hooks/useImport';

interface ImportModalProps {
    onClose: () => void;
    onComplete: (count?: number) => void;
}

function UploadStep({ onFile }: { onFile: (f: File) => void }) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
        },
        [onFile],
    );

    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <span className="text-4xl">📂</span>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Upload a CSV file
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Expects columns: date, category, and optional metadata
                    fields.
                </p>
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors">
                Choose file
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleChange}
                    className="hidden"
                />
            </label>
        </div>
    );
}

export function ImportModal({ onClose, onComplete }: ImportModalProps) {
    const handleComplete = useCallback(
        (count: number) => {
            onComplete(count);
        },
        [onComplete],
    );

    const {
        step,
        file,
        summary,
        loading,
        importing,
        setFile,
        parse,
        confirm,
        reset,
    } = useImport(handleComplete);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <p className="font-semibold text-gray-800 dark:text-zinc-200">
                        Import from CSV
                    </p>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-lg leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {step === 'upload' && <UploadStep onFile={setFile} />}

                    {step === 'upload' && file && (
                        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                            <span className="text-xs text-gray-700 dark:text-zinc-300 truncate">
                                {file.name}
                            </span>
                            <button
                                onClick={parse}
                                disabled={loading}
                                className="ml-3 text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shrink-0"
                            >
                                {loading ? 'Parsing…' : 'Preview'}
                            </button>
                        </div>
                    )}

                    {step === 'preview' && summary && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                                        {summary.total}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                        Total rows
                                    </p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {summary.valid}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                        Valid
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <p className="text-lg font-bold text-red-500 dark:text-red-400">
                                        {summary.invalid}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                        Errors
                                    </p>
                                </div>
                            </div>

                            {summary.records.slice(0, 10).map((r) => (
                                <div
                                    key={r.rowIndex}
                                    className={`p-2 rounded-lg text-xs ${
                                        r.issues.length > 0
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                                            : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Row {r.rowIndex}: {r.category ?? 'unknown'}{' '}
                                    · {r.entryDate ?? 'no date'}
                                    {r.issues.length > 0 && (
                                        <span className="ml-2 text-red-400">
                                            {' '}
                                            ({r.issues[0]})
                                        </span>
                                    )}
                                </div>
                            ))}

                            {summary.total > 10 && (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                                    …and {summary.total - 10} more rows
                                </p>
                            )}
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <span className="text-4xl">✅</span>
                            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                                Import complete!
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 justify-end">
                    {step === 'done' ? (
                        <button
                            onClick={onClose}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        >
                            Done
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    reset();
                                    onClose();
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            {step === 'preview' && summary && (
                                <button
                                    onClick={() => {
                                        void confirm();
                                    }}
                                    disabled={importing || summary.valid === 0}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                                >
                                    {importing
                                        ? 'Importing…'
                                        : `Import ${summary.valid} rows`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
