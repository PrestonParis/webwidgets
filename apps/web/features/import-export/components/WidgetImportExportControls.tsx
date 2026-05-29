'use client';

import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useWidgetImportExport } from '@/features/import-export/hooks/useWidgetImportExport';
import { WidgetImportModal } from '@/features/import-export/components/WidgetImportModal';
import type { SourceDestinationType } from '@/features/import-export/types/importExport';

interface Props {
    sourceType: SourceDestinationType;
    displayName: string;
}

const BTN =
    'opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300';

export function WidgetImportExportControls({ sourceType, displayName }: Props) {
    const { exporting, exportData } = useWidgetImportExport(sourceType);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const handleExportClick = () => setExportOpen((v) => !v);

    const handleFormat = (format: 'json' | 'csv') => {
        setExportOpen(false);
        void exportData(format);
    };

    return (
        <>
            {/* Export button + format dropdown */}
            <div ref={exportRef} className="relative">
                <button
                    onClick={handleExportClick}
                    disabled={exporting}
                    title={`Export ${displayName}`}
                    className={cn(
                        BTN,
                        exporting && 'opacity-50 pointer-events-none',
                    )}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
                {exportOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[100px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            onClick={() => handleFormat('json')}
                        >
                            JSON
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            onClick={() => handleFormat('csv')}
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
                className={BTN}
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
