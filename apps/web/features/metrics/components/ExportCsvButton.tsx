'use client';

import { Download } from 'lucide-react';
import { buildCsvFromRows, downloadCsv } from '../lib/metricsApi';

interface ExportCsvButtonProps {
    rows: Record<string, unknown>[];
    filename: string;
}

export function ExportCsvButton({ rows, filename }: ExportCsvButtonProps) {
    const handleClick = () => {
        const csv = buildCsvFromRows(rows);
        downloadCsv(csv, filename);
    };

    return (
        <button
            onClick={handleClick}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
            <Download size={13} />
            Export CSV
        </button>
    );
}
