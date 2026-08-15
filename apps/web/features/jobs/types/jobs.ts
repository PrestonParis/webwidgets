import type { Json } from '@/types/supabase';

export type JobStatus =
    | 'queued'
    | 'running'
    | 'waiting_for_permission'
    | 'waiting_for_approval'
    | 'waiting'
    | 'completed'
    | 'failed'
    | 'dead_lettered'
    | 'cancelled';

export type JobType =
    | 'email_action_extraction'
    | 'cheatsheet_generation'
    | 'research_task'
    | 'import_processing'
    | 'tracking_insight_generation'
    | 'finance_categorization'
    | 'document_parsing'
    | 'transcription'
    | 'automation_run'
    | 'runtime.probe';

export interface JobRecord {
    id: string;
    userId: string;
    type: JobType;
    status: JobStatus;
    retryCount: number;
    failureReason: string | null;
    confidence: number | null;
    userVisibleResult: Json | null;
    metadata: Json;
    createdAt: string;
    updatedAt: string;
}

export interface JobStepRecord {
    id: string;
    jobId: string;
    name: string;
    status: JobStatus;
    startedAt: string | null;
    completedAt: string | null;
}
