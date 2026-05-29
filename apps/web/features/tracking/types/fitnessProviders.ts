import type {
    ExerciseDefinition,
    ExerciseSearchFilters,
    WorkoutSession,
} from '@/features/tracking/types/fitness';
import type { ImportPreview } from '@/features/tracking/types/fitnessImport';

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
