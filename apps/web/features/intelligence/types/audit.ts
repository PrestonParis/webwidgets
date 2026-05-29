import type { PredictionTask } from '@/features/intelligence/types/inference';

export interface InferenceAudit {
    requestId: string;
    providerId: string;
    task: PredictionTask;
    startedAt: string;
    completedAt?: string;
    status: 'success' | 'failed' | 'skipped';
    redactedInputHash?: string;
    errorMessage?: string;
}
