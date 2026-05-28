import type {
    ExerciseDefinition,
    ExerciseSearchFilters,
    WorkoutSession,
} from '../types';
import type { ImportPreview } from '../importTypes';

export interface ExerciseLibraryProvider {
    id: string;
    label: string;
    search(filters: ExerciseSearchFilters): Promise<ExerciseDefinition[]>;
    getById(id: string): Promise<ExerciseDefinition | null>;
}

export interface WorkoutImportProvider {
    id: string;
    label: string;
    configured: boolean;
    preview(input: string): Promise<ImportPreview>;
    commit(
        rows: WorkoutSession[],
    ): Promise<{ imported: number; skipped: number; errors: string[] }>;
}

export interface WearableProvider {
    id: string;
    label: string;
    configured: boolean;
    syncStatus(): Promise<{
        ok: boolean;
        lastSyncedAt?: string;
        error?: string;
        rateLimitedUntil?: string;
    }>;
    fetchWorkouts(from: string, to: string): Promise<WorkoutSession[]>;
}
