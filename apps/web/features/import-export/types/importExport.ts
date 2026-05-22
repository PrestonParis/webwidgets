export type ImportFormat = 'csv' | 'xlsx' | 'google_sheets' | 'json';
export type DuplicateStrategy = 'skip' | 'replace' | 'merge' | 'create_new';

export interface ImportMapping {
    sourceColumn: string;
    targetField: string;
    category?: string;
}

export interface ValidationResult {
    valid: boolean;
    rowNumber?: number;
    message?: string;
}

export interface ImportJob {
    id: string;
    userId: string;
    format: ImportFormat;
    duplicateStrategy: DuplicateStrategy;
    mappings: ImportMapping[];
    validationResults: ValidationResult[];
    status: 'draft' | 'previewed' | 'importing' | 'completed' | 'failed';
}
