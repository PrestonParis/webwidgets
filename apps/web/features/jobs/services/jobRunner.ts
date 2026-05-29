import type { SupabaseClient } from '@supabase/supabase-js';
import type { JobRecord } from '@/features/jobs/types/jobs';

export interface JobRunner {
    canRun: (job: JobRecord) => boolean;
    run: (job: JobRecord, supabase: SupabaseClient) => Promise<void>;
}

const runners: JobRunner[] = [];

export function registerJobRunner(runner: JobRunner) {
    runners.push(runner);
}

export function getRunnerForJob(job: JobRecord) {
    return runners.find((runner) => runner.canRun(job)) ?? null;
}
