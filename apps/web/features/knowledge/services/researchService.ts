import type { SupabaseClient } from '@supabase/supabase-js';
import { createJob } from '@/features/jobs/services/jobService';

export async function createResearchJob(
    supabase: SupabaseClient,
    userId: string,
    question: string,
) {
    return createJob(supabase, userId, 'research_task', { question });
}
