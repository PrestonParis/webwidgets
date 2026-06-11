import type {
    ImportFormat,
    DuplicateStrategy,
    SourceDestinationType,
    ExportOptions,
    ExportResult,
    ImportExecutionResult,
    MappedRow,
    AdapterAvailability,
} from '@/features/import-export/types/importExport';
import type { AdapterContextMapper } from './contextMapper';

export interface ImportExportAdapter {
    id: string;
    displayName: string;
    description: string;
    sourceType: SourceDestinationType;

    // Capabilities
    canImport: boolean;
    canExport: boolean;
    canProvideContext: boolean;

    // Supported formats
    importFormats: ImportFormat[];
    exportFormats: ('csv' | 'json' | 'docx' | 'pdf')[];

    /** Check if the underlying table/service is available */
    checkAvailability(): Promise<AdapterAvailability>;

    /** Collect all data for this source and return normalized rows */
    exportData?(userId: string, options?: ExportOptions): Promise<ExportResult>;

    /** Write mapped rows into the target table */
    importData?(
        userId: string,
        rows: MappedRow[],
        strategy: DuplicateStrategy,
    ): Promise<ImportExecutionResult>;

    /** Return formatted text for AI system prompt */
    provideContext?(userId: string): Promise<string>;

    /**
     * Build a rich HTML document from this adapter's data, suitable for
     * conversion to docx/pdf via the conversion service.
     * Only implement for adapters where a document layout makes sense (e.g. journals).
     */
    exportDocument?(
        userId: string,
        options?: ExportOptions,
    ): Promise<{ html: string; title: string; warnings: string[] }>;

    /** Optional normalized adapter row -> context graph mapper */
    mapToContext?: AdapterContextMapper | undefined;
}
