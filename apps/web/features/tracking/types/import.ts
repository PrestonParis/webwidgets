import type { TrackingCategory } from './trackingCategoryTypes';

export type ImportFormat = 'csv' | 'json';

export interface ParsedRow {
    rowIndex: number;
    raw: Record<string, string>;
}

export interface ImportRecord {
    rowIndex: number;
    category: TrackingCategory | null;
    entryDate: string | null;
    metadata: Record<string, unknown>;
    tags: string[];
    notes?: string;
    issues: string[];
}

export interface ImportSummary {
    total: number;
    valid: number;
    invalid: number;
    records: ImportRecord[];
}

export type ImportStep = 'upload' | 'preview' | 'confirm' | 'done';
