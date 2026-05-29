'use client';

import { Upload, Download, Brain } from 'lucide-react';
import type { AdapterRegistryPanelProps } from '@/features/import-export/types/importExport';

export function AdapterRegistryPanel({
    capabilities,
}: AdapterRegistryPanelProps) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Registered Adapters ({capabilities.length})
            </h3>

            {capabilities.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No adapters registered yet.
                </p>
            )}

            <div className="space-y-3">
                {capabilities.map((cap) => (
                    <div
                        key={cap.id}
                        className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {cap.displayName}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {cap.description}
                                </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                {cap.canImport && (
                                    <span
                                        title="Supports import"
                                        className="p-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                                    >
                                        <Upload size={12} />
                                    </span>
                                )}
                                {cap.canExport && (
                                    <span
                                        title="Supports export"
                                        className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                                    >
                                        <Download size={12} />
                                    </span>
                                )}
                                {cap.canProvideContext && (
                                    <span
                                        title="Provides AI context"
                                        className="p-1 rounded bg-violet-50 dark:bg-violet-950/30 text-violet-600"
                                    >
                                        <Brain size={12} />
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {cap.importFormats.map((f) => (
                                <span
                                    key={f}
                                    className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                >
                                    {f}
                                </span>
                            ))}
                            {cap.exportFormats.map((f) => (
                                <span
                                    key={`exp-${f}`}
                                    className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                >
                                    {f} (out)
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
