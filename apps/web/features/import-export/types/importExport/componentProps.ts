import type {
    AdapterCapability,
    ContextExportRecord,
    ExportJob,
    ImportJob,
    ServiceHealth,
    SourceDestinationType,
} from './core';

// ── Component props ───────────────────────────────────────────────────────────
export interface AdapterRegistryPanelProps {
    capabilities: AdapterCapability[];
}

export interface ContextExportPanelProps {
    contextExports: ContextExportRecord[];
    onGenerate: () => Promise<unknown>;
}

export interface ExportPanelProps {
    capabilities: AdapterCapability[];
    exportJobs: ExportJob[];
    onExport: (data: {
        source_type: string;
        format: string;
        title?: string;
    }) => Promise<{
        job: ExportJob;
        download: {
            content: string;
            encoding?: 'base64';
            contentType: string;
            filename: string;
        };
        warnings: string[];
    } | null>;
}

export interface ImportWizardParseResult {
    headers: string[];
    totalRows: number;
    sampleRows: Array<{ rowIndex: number; raw: Record<string, string> }>;
    fieldTypes: Array<{ column: string; inferredType: string }>;
}

export interface ImportWizardExecuteResult {
    status: string;
    successCount: number;
    errorCount: number;
    warningCount: number;
    errors: Array<{ rowIndex: number; message: string }>;
    warnings: string[];
}

export interface ImportWizardProps {
    capabilities: AdapterCapability[];
    importJobs: ImportJob[];
    onCreateJob: (data: {
        format: string;
        destination_type: string;
        duplicate_strategy: string;
        title?: string;
    }) => Promise<ImportJob | null>;
    onParseJob: (
        jobId: string,
        content: string,
        filename?: string,
    ) => Promise<ImportWizardParseResult | null>;
    onExecuteJob: (
        jobId: string,
        data: {
            mappings: Array<{ sourceColumn: string; targetField: string }>;
            duplicate_strategy: string;
            rows: Array<{ rowIndex: number; raw: Record<string, string> }>;
        },
    ) => Promise<ImportWizardExecuteResult | null>;
}

export interface ServiceHealthPanelProps {
    health: ServiceHealth | null;
    loading: boolean;
    onRefresh: () => void;
}

export interface WidgetImportExportControlsProps {
    sourceType: SourceDestinationType;
    displayName: string;
}

export interface WidgetImportModalProps {
    open: boolean;
    onClose: () => void;
    sourceType: SourceDestinationType;
    displayName: string;
}
