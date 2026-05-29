import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import type { JobRecord, JobStatus, JobType } from '@/features/jobs/types/jobs';

function rowToJob(row: Record<string, unknown>): JobRecord {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        type: row.type as JobType,
        status: row.status as JobStatus,
        retryCount: (row.retry_count as number) ?? 0,
        failureReason: (row.failure_reason as string | null) ?? null,
        confidence: (row.confidence as number | null) ?? null,
        userVisibleResult: (row.user_visible_result as Json | null) ?? null,
        metadata: (row.metadata as Json) ?? {},
        createdAt: row.created_at as string,
        updatedAt: (row.updated_at as string) ?? (row.created_at as string),
    };
}

export async function listJobs(supabase: SupabaseClient, userId: string) {
    const result = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (result.error) throw result.error;
    return ((result.data ?? []) as unknown as Record<string, unknown>[]).map(
        rowToJob,
    );
}

export async function getJob(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
): Promise<JobRecord | null> {
    const result = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('id', jobId)
        .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return rowToJob(result.data as unknown as Record<string, unknown>);
}

export async function createJob(
    supabase: SupabaseClient,
    userId: string,
    type: JobType,
    metadata: Json = {},
): Promise<JobRecord> {
    const result = await supabase
        .from('jobs')
        .insert({ user_id: userId, type, status: 'queued', metadata })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToJob(result.data as unknown as Record<string, unknown>);
}

export async function updateJobStatus(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
    status: JobStatus,
    failureReason?: string,
): Promise<JobRecord> {
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
    return rowToJob(result.data as unknown as Record<string, unknown>);
}

export async function cancelJob(
    supabase: SupabaseClient,
    userId: string,
    jobId: string,
): Promise<JobRecord> {
    return updateJobStatus(supabase, userId, jobId, 'cancelled');
}
