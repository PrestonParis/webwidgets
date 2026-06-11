'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useWidgetImportExport } from '@/features/import-export/hooks/useWidgetImportExport';
import { WidgetImportModal } from '@/features/import-export/components/WidgetImportModal';
import type { WidgetImportExportControlsProps } from '@/features/import-export/types/importExport';

const BTN =
    'opacity-0 group-hover:opacity-100 transition-opacity h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300';

export function WidgetImportExportControls({
    sourceType,
    displayName,
}: WidgetImportExportControlsProps) {
    const { exporting, exportData } = useWidgetImportExport(sourceType);
    const [fmtOpen, setFmtOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    // Close format picker on outside click
    useEffect(() => {
        if (!fmtOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node))
                setFmtOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [fmtOpen]);

    return (
        <>
            {/* Export: single click = JSON, chevron = other formats */}
            <div ref={dropRef} className="relative flex items-center">
                <button
                    onClick={() => void exportData('json')}
                    disabled={exporting}
                    title={`Export ${displayName} as JSON`}
                    className={cn(
                        BTN,
                        'px-2 rounded-r-none border-r border-gray-200 dark:border-zinc-700',
                        exporting && 'opacity-50 pointer-events-none',
                    )}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setFmtOpen((v) => !v)}
                    disabled={exporting}
                    title="Export as another format"
                    className={cn(
                        BTN,
                        'px-1 rounded-l-none',
                        exporting && 'opacity-50 pointer-events-none',
                    )}
                >
                    <ChevronDown className="w-3 h-3" />
                </button>

                {fmtOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-28 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Format
                        </p>
                        <button
                            className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                            onClick={() => {
                                setFmtOpen(false);
                                void exportData('json');
                            }}
                        >
                            JSON
                            <span className="text-[10px] text-zinc-400">
                                default
                            </span>
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            onClick={() => {
                                setFmtOpen(false);
                                void exportData('csv');
                            }}
                        >
                            CSV
                        </button>
                    </div>
                )}
            </div>

            {/* Import button */}
            <button
                onClick={() => setImportOpen(true)}
                title={`Import ${displayName}`}
                className={cn(BTN, 'px-2')}
            >
                <Upload className="w-3.5 h-3.5" />
            </button>

            <WidgetImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                sourceType={sourceType}
                displayName={displayName}
            />
        </>
    );
}
