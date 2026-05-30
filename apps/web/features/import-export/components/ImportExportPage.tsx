'use client';

import { useState } from 'react';
import Header from '@/features/ui/components/Header';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { useImportExport } from '@/features/import-export/hooks/useImportExport';
import { ServiceHealthPanel } from './ServiceHealthPanel';
import { AdapterRegistryPanel } from './AdapterRegistryPanel';
import { ImportWizard } from './ImportWizard';
import { ExportPanel } from './ExportPanel';
import { ContextExportPanel } from './ContextExportPanel';
import type {
    ImportJob,
    ExportJob,
} from '@/features/import-export/types/importExport';

type Tab = 'overview' | 'import' | 'export' | 'context' | 'registry';

const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'import', label: 'Import' },
    { id: 'export', label: 'Export' },
    { id: 'context', label: 'Context' },
    { id: 'registry', label: 'Registry' },
];

export function ImportExportPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const {
        capabilities,
        health,
        importJobs,
        exportJobs,
        contextExports,
        loading,
        refresh,
        createImportJob,
        parseImportJob,
        executeImportJob,
        createExportJob,
        createContextExport,
    } = useImportExport();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Data mobility"
                title="Import & Export"
                description="Move data in and out of WebWidgets. Import CSV/JSON files into tracking entries and todos. Export your data. Generate context bundles for AI."
            >
                {/* Tab bar */}
                <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 mb-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <ServiceHealthPanel
                            health={health}
                            loading={loading}
                            onRefresh={refresh}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-center">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {importJobs.length}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Import jobs
                                </p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-center">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {exportJobs.length}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Export jobs
                                </p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-center">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {contextExports.length}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Context exports
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                Unavailable formats (packages not installed)
                            </h3>
                            <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                                <li>
                                    <strong>XLSX</strong>: install the{' '}
                                    <code>xlsx</code> npm package to enable
                                    Excel imports/exports
                                </li>
                                <li>
                                    <strong>ZIP</strong>: install the{' '}
                                    <code>jszip</code> npm package to enable ZIP
                                    exports
                                </li>
                                <li>
                                    <strong>Google Sheets</strong>: requires
                                    Google Sheets API credentials
                                </li>
                                <li>
                                    <strong>S3 file attachments</strong>:
                                    configure AWS S3 environment variables to
                                    attach files to import jobs
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Import */}
                {activeTab === 'import' && (
                    <ImportWizard
                        capabilities={capabilities}
                        importJobs={importJobs}
                        onCreateJob={async (data) => {
                            return createImportJob(data);
                        }}
                        onParseJob={async (jobId, content, filename) => {
                            return parseImportJob(jobId, content, filename);
                        }}
                        onExecuteJob={async (jobId, data) => {
                            return executeImportJob(jobId, data);
                        }}
                    />
                )}

                {/* Export */}
                {activeTab === 'export' && (
                    <ExportPanel
                        capabilities={capabilities}
                        exportJobs={exportJobs}
                        onExport={async (data) => {
                            return createExportJob(data) as Promise<{
                                job: ExportJob;
                                download: {
                                    content: string;
                                    contentType: string;
                                    filename: string;
                                };
                                warnings: string[];
                            } | null>;
                        }}
                    />
                )}

                {/* Context */}
                {activeTab === 'context' && (
                    <ContextExportPanel
                        contextExports={contextExports}
                        onGenerate={createContextExport}
                    />
                )}

                {/* Registry */}
                {activeTab === 'registry' && (
                    <AdapterRegistryPanel capabilities={capabilities} />
                )}
            </ProductPageShell>
        </>
    );
}
