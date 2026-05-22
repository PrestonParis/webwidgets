import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import type { JobRecord, JobStatus, JobType } from '@/features/jobs/types/jobs';

export async function listJobs(supabase: SupabaseClient, userId: string) {
    const result = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (result.error) throw result.error;
    return (result.data ?? []) as JobRecord[];
}

export async function getJob(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
) {
    const result = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('id', jobId)
        .maybeSingle();
    if (result.error) throw result.error;
    return result.data as JobRecord | null;
}

export async function createJob(
    supabase: SupabaseClient,
    userId: string,
    type: JobType,
    metadata: Json = {},
) {
    const result = await supabase
        .from('jobs')
        .insert({ user_id: userId, type, status: 'queued', metadata })
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as JobRecord;
}

export async function updateJobStatus(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
    status: JobStatus,
    failureReason?: string,
) {
    const result = await supabase
        .from('jobs')
        .update({
            status,
            failure_reason: failureReason ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('id', jobId)
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as JobRecord;
}

export async function cancelJob(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
) {
    return updateJobStatus(supabase, userId, jobId, 'cancelled');
}
