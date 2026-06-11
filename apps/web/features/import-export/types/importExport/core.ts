// Full service types — replaces the old stub

export type ImportFormat = 'csv' | 'xlsx' | 'json';
export type DuplicateStrategy = 'skip' | 'overwrite' | 'merge' | 'keep_both';
export type ImportJobStatus =
    | 'draft'
    | 'file_uploaded'
    | 'parsed'
    | 'mapped'
    | 'validated'
    | 'ready'
    | 'running'
    | 'completed'
    | 'completed_with_warnings'
    | 'failed'
    | 'canceled';
export type ExportJobStatus =
    | 'requested'
    | 'collecting'
    | 'transforming'
    | 'generating'
    | 'ready'
    | 'delivered'
    | 'failed'
    | 'expired'
    | 'canceled';
export type ContextExportStatus =
    | 'requested'
    | 'collecting'
    | 'ready'
    | 'empty'
    | 'failed'
    | 'unavailable'
    | 'permission_denied';
export type SourceDestinationType =
    | 'file'
    | 'tracking_entries'
    | 'todos'
    | 'collaboration_workspaces'
    | 'collaboration_handoffs'
    | 'context_entries'
    | 'ai_context'
    | 'mood_logs'
    | 'journals'
    | 'habits'
    | 'finance_records'
    | 'countdowns'
    | 'recovery_records'
    | 'calendar_events'
    | 'memory_decks'
    | 'files'
    | 'documents'
    | 'activity_events';

// ── Field mapping ─────────────────────────────────────────────────────────────
export interface FieldMapping {
    sourceColumn: string;
    targetField: string;
    category?: string;
}

// ── Parsed rows (from file parser) ───────────────────────────────────────────
export interface ParsedRow {
    rowIndex: number;
    raw: Record<string, string>;
}

export interface ParseResult {
    headers: string[];
    rows: ParsedRow[];
    totalRows: number;
    errors: ParseError[];
}

export interface ParseError {
    row?: number;
    message: string;
    type: 'parse' | 'validation' | 'format';
}

// ── Field type inference ──────────────────────────────────────────────────────
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

export interface FieldTypeInfo {
    column: string;
    inferredType: FieldType;
    sampleValues: string[];
    confidence: number;
}

// ── Mapped row (after field mapping applied) ──────────────────────────────────
export interface MappedRow {
    rowIndex: number;
    data: Record<string, unknown>;
}

// ── Import job ────────────────────────────────────────────────────────────────
export interface ImportJob {
    id: string;
    userId: string;
    title?: string;
    format: ImportFormat;
    sourceType: SourceDestinationType;
    destinationType: SourceDestinationType;
    duplicateStrategy: DuplicateStrategy;
    mappings: FieldMapping[];
    validationResults: ValidationResult[];
    status: ImportJobStatus;
    rowCount?: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    error?: string;
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
}

export interface ImportJobLog {
    id: string;
    importJobId: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    rowNumber?: number;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface ValidationResult {
    valid: boolean;
    rowNumber?: number;
    message?: string;
}

// ── Export job ────────────────────────────────────────────────────────────────
export interface ExportJob {
    id: string;
    userId: string;
    title: string;
    sourceType: SourceDestinationType;
    format: 'json' | 'csv' | 'xlsx' | 'zip' | 'docx' | 'pdf';
    status: ExportJobStatus;
    rowCount?: number;
    outputUrl?: string;
    outputSizeBytes?: number;
    outputExpiresAt?: string;
    error?: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

// ── Context export ────────────────────────────────────────────────────────────
export interface ContextExportRecord {
    id: string;
    userId: string;
    scope: string;
    status: ContextExportStatus;
    sources: unknown[];
    systemPromptContent?: string;
    warnings: string[];
    errors: string[];
    availableSources: number;
    unavailableSources: number;
    expiresAt: string;
    createdAt: string;
}

// ── Adapter capability (for discovery endpoint) ───────────────────────────────
export interface AdapterCapability {
    id: string;
    displayName: string;
    description: string;
    sourceType: SourceDestinationType;
    canImport: boolean;
    canExport: boolean;
    canProvideContext: boolean;
    importFormats: ImportFormat[];
    exportFormats: ('csv' | 'json' | 'docx' | 'pdf')[];
    availability?: 'available' | 'unavailable' | 'unknown';
    availabilityMessage?: string;
}

// ── Service health ────────────────────────────────────────────────────────────
export interface ServiceHealth {
    db: 'ok' | 'error';
    storage: 'ok' | 'unconfigured';
    adapters: number;
    services: ServiceHealthItem[];
    checkedAt: string;
}

export interface ServiceHealthItem {
    name: string;
    status: 'ok' | 'error' | 'unconfigured';
    message?: string;
}

// ── Export options / results ──────────────────────────────────────────────────
export interface ExportOptions {
    limit?: number;
    since?: string;
    format?: 'csv' | 'json' | 'docx' | 'pdf';
    // Date range filters — used by adapters like calendarEventsAdapter
    startDate?: string;
    endDate?: string;
}

export interface ExportResult {
    rows: MappedRow[];
    totalCount: number;
    warnings: string[];
    // Optional richer payload for inline runtime reads.
    // When set, the exports route returns this as `data` instead of the flat `records` array.
    // Use when the adapter needs to return multiple related tables (e.g. habits + completions).
    inlinePayload?: unknown;
}

// ── Import execution result ───────────────────────────────────────────────────
export interface ImportExecutionResult {
    successCount: number;
    errorCount: number;
    warningCount: number;
    errors: ImportRowError[];
    warnings: string[];
}

export interface ImportRowError {
    rowIndex: number;
    message: string;
}

// ── Adapter availability ──────────────────────────────────────────────────────
export interface AdapterAvailability {
    available: boolean;
    message?: string;
}
