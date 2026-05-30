'use client';

import { useState, useCallback } from 'react';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { SourceDestinationType } from '@/features/import-export/types/importExport';

export interface WidgetParseResult {
    jobId: string;
    headers: string[];
    totalRows: number;
    sampleRows: Array<{ rowIndex: number; raw: Record<string, string> }>;
    fieldTypes: Array<{ column: string; inferredType: string }>;
}

function downloadBlob(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function useWidgetImportExport(sourceType: SourceDestinationType) {
    const toast = useToastContext();
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [executing, setExecuting] = useState(false);

    const exportData = useCallback(
        async (format: 'json' | 'csv') => {
            setExporting(true);
            try {
                const res = await fetch('/api/import-export/exports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_type: sourceType, format }),
                });
                const json = await res.json();
                if (!res.ok || !json.ok) {
                    toast.error(json.message ?? 'Export failed');
                    return;
                }
                const { content, contentType, filename } = json.download as {
                    content: string;
                    contentType: string;
                    filename: string;
                };
                downloadBlob(content, filename, contentType);
                toast.success(`Exported as ${format.toUpperCase()}`);
            } catch {
                toast.error('Export failed');
            } finally {
                setExporting(false);
            }
        },
        [sourceType, toast],
    );

    const parseFile = useCallback(
        async (
            file: File,
            format: 'csv' | 'json',
            duplicateStrategy: 'skip' | 'overwrite' | 'keep_both',
        ): Promise<WidgetParseResult | null> => {
            setImporting(true);
            try {
                const content = await file.text();

                const jobRes = await fetch('/api/import-export/imports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        format,
                        destination_type: sourceType,
                        duplicate_strategy: duplicateStrategy,
                        title: `Import ${new Date().toLocaleDateString()}`,
                    }),
                });
                const jobJson = await jobRes.json();
                if (!jobRes.ok || !jobJson.ok) {
                    toast.error(
                        jobJson.message ?? 'Failed to create import job',
                    );
                    return null;
                }
                const jobId = jobJson.job.id as string;

                const parseRes = await fetch(
                    `/api/import-export/imports/${jobId}/parse`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, filename: file.name }),
                    },
                );
                const parseJson = await parseRes.json();
                if (!parseRes.ok || !parseJson.ok) {
                    toast.error(parseJson.message ?? 'Failed to parse file');
                    return null;
                }

                return {
                    jobId,
                    headers: parseJson.headers ?? [],
                    totalRows: parseJson.totalRows ?? 0,
                    sampleRows: parseJson.sampleRows ?? [],
                    fieldTypes: parseJson.fieldTypes ?? [],
                };
            } catch {
                toast.error('Failed to read file');
                return null;
            } finally {
                setImporting(false);
            }
        },
        [sourceType, toast],
    );

    const executeImport = useCallback(
        async (
            jobId: string,
            mappings: Array<{ sourceColumn: string; targetField: string }>,
            rows: Array<{ rowIndex: number; raw: Record<string, string> }>,
            duplicateStrategy: string,
        ) => {
            setExecuting(true);
            try {
                const res = await fetch(
                    `/api/import-export/imports/${jobId}/execute`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mappings,
                            duplicate_strategy: duplicateStrategy,
                            rows,
                        }),
                    },
                );
                const json = await res.json();
                if (!res.ok || !json.ok) {
                    toast.error(json.message ?? 'Import execution failed');
                    return null;
                }
                if (json.errorCount > 0) {
                    toast.warning(
                        `Import done with ${json.errorCount} error(s). ${json.successCount} rows imported.`,
                    );
                } else {
                    toast.success(`${json.successCount} rows imported`);
                }
                return json as {
                    status: string;
                    successCount: number;
                    errorCount: number;
                    warningCount: number;
                    errors: Array<{ rowIndex: number; message: string }>;
                };
            } catch {
                toast.error('Import failed');
                return null;
            } finally {
                setExecuting(false);
            }
        },
        [toast],
    );

    return {
        exporting,
        importing,
        executing,
        exportData,
        parseFile,
        executeImport,
    };
}
