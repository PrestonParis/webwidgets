import type { WorkoutSession } from './types';

export interface ImportPreviewRow {
    rowIndex: number;
    status: 'ready' | 'duplicate' | 'skipped';
    issues: string[];
    session?: WorkoutSession;
}

export interface ImportPreview {
    provider: string;
    total: number;
    ready: number;
    duplicates: number;
    skipped: number;
    rows: ImportPreviewRow[];
}
