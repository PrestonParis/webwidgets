'use client';

import { apiRouteFetch, readApiJson } from '@/lib/api/client';
import { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type {
    AdapterCapability,
    ServiceHealth,
    ImportJob,
    ExportJob,
    ContextExportRecord,
    ImportWizardParseResult,
    ImportWizardExecuteResult,
} from '@/features/import-export/types/importExport';

export function useImportExport() {
    const toast = useToastContext();
    const [capabilities, setCapabilities] = useState<AdapterCapability[]>([]);
    const [health, setHealth] = useState<ServiceHealth | null>(null);
    const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
    const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
    const [contextExports, setContextExports] = useState<ContextExportRecord[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [capsRes, healthRes, importsRes, exportsRes, ctxRes] =
                await Promise.allSettled([
                    apiRouteFetch('/api/import-export/capabilities').then(
                        readApiJson,
                    ),
                    apiRouteFetch('/api/import-export/health').then(
                        readApiJson,
                    ),
                    apiRouteFetch('/api/import-export/imports').then(
                        readApiJson,
                    ),
                    apiRouteFetch('/api/import-export/exports').then(
                        readApiJson,
                    ),
                    apiRouteFetch('/api/import-export/context-export').then(
                        readApiJson,
                    ),
                ]);

            if (capsRes.status === 'fulfilled' && capsRes.value.ok) {
                setCapabilities(
                    (capsRes.value.capabilities as AdapterCapability[]) ?? [],
                );
            }
            if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
                setHealth((healthRes.value.health as ServiceHealth) ?? null);
            }
            if (importsRes.status === 'fulfilled' && importsRes.value.ok) {
                setImportJobs((importsRes.value.jobs as ImportJob[]) ?? []);
            }
            if (exportsRes.status === 'fulfilled' && exportsRes.value.ok) {
                setExportJobs((exportsRes.value.jobs as ExportJob[]) ?? []);
            }
            if (ctxRes.status === 'fulfilled' && ctxRes.value.ok) {
                setContextExports(
                    (ctxRes.value.exports as ContextExportRecord[]) ?? [],
                );
            }
        } catch (e) {
            const msg =
                e instanceof Error
                    ? e.message
                    : 'Failed to load import/export data';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const createImportJob = useCallback(
        async (data: {
            title?: string;
            format: string;
            source_type?: string;
            destination_type?: string;
            duplicate_strategy?: string;
        }) => {
            const res = await apiRouteFetch('/api/import-export/imports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await readApiJson(res);
            if (!res.ok || !json.ok) {
                toast.error(json.message ?? 'Failed to create import job');
                return null;
            }
            toast.success('Import job created');
            void refresh();
            return json.job as ImportJob;
        },
        [toast, refresh],
    );

    const parseImportJob = useCallback(
        async (jobId: string, content: string, filename?: string) => {
            const res = await apiRouteFetch(
                `/api/import-export/imports/${jobId}/parse`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, filename }),
                },
            );
            const json = await readApiJson(res);
            if (!res.ok || !json.ok) {
                toast.error(json.message ?? 'Failed to parse file');
                return null;
            }
            return json as unknown as ImportWizardParseResult;
        },
        [toast],
    );

    const executeImportJob = useCallback(
        async (
            jobId: string,
            data: {
                mappings: Array<{ sourceColumn: string; targetField: string }>;
                duplicate_strategy?: string;
                rows?: Array<{ rowIndex: number; raw: Record<string, string> }>;
            },
        ) => {
            const res = await apiRouteFetch(
                `/api/import-export/imports/${jobId}/execute`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                },
            );
            const json = await readApiJson(res);
            if (!res.ok || !json.ok) {
                toast.error(json.message ?? 'Import execution failed');
                return null;
            }
            const errorCount = Number(json.errorCount ?? 0);
            const successCount = Number(json.successCount ?? 0);
            if (errorCount > 0) {
                toast.warning(
                    `Import completed with ${errorCount} error(s) and ${successCount} success(es)`,
                );
            } else {
                toast.success(
                    `Import complete. ${successCount} rows imported.`,
                );
            }
            void refresh();
            return json as unknown as ImportWizardExecuteResult;
        },
        [toast, refresh],
    );

    const createExportJob = useCallback(
        async (data: {
            source_type: string;
            format: string;
            title?: string;
        }) => {
            const res = await apiRouteFetch('/api/import-export/exports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await readApiJson(res);
            if (!res.ok || !json.ok) {
                toast.error(json.message ?? 'Export failed');
                return null;
            }
            toast.success('Export ready');
            void refresh();
            return json as {
                job: ExportJob;
                download: {
                    content: string;
                    contentType: string;
                    filename: string;
                };
                warnings: string[];
            };
        },
        [toast, refresh],
    );

    const createContextExport = useCallback(async () => {
        const res = await apiRouteFetch('/api/import-export/context-export', {
            method: 'POST',
        });
        const json = await readApiJson(res);
        if (!res.ok || !json.ok) {
            toast.error(json.message ?? 'Context export failed');
            return null;
        }
        toast.success('Context bundle generated');
        void refresh();
        return json;
    }, [toast, refresh]);

    return {
        capabilities,
        health,
        importJobs,
        exportJobs,
        contextExports,
        loading,
        error,
        refresh,
        createImportJob,
        parseImportJob,
        executeImportJob,
        createExportJob,
        createContextExport,
    };
}
